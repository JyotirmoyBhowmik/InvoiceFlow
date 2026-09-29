import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import zlib from 'zlib';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Increase JSON payload limit for PDF/image base64 payloads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Initialize GoogleGenAI SDK (picks up GEMINI_API_KEY from environment)
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI();
  }
} catch (e) {
  console.warn('GoogleGenAI initialization warning:', e);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiInitialized: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// Extraction helper: Fallback local stream / text parser for PDFs
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const textTokens: string[] = [];
  try {
    // 1. Uncompressed strings (Tj, TJ)
    const rawLatin = buffer.toString('latin1');
    const tjMatches = rawLatin.matchAll(/\(([^\\)]|\\.)*\)\s*(?:Tj|'|")/g);
    for (const m of tjMatches) {
      const clean = m[0]
        .replace(/^\(/, '')
        .replace(/\)\s*(?:Tj|'|")$/, '')
        .replace(/\\([()\\])/g, '$1')
        .trim();
      if (clean.length > 0 && !clean.startsWith('%PDF') && !clean.startsWith('/')) {
        textTokens.push(clean);
      }
    }

    // 2. Scan for FlateDecode compressed streams and decompress with zlib
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;
    while ((match = streamRegex.exec(rawLatin)) !== null) {
      try {
        const streamStartIndex = match.index + match[0].indexOf('\n') + 1;
        const streamEndIndex = match.index + match[0].lastIndexOf('endstream');
        const streamBuffer = buffer.slice(streamStartIndex, streamEndIndex);

        const decompressed = zlib.inflateSync(streamBuffer);
        const decompText = decompressed.toString('utf-8');

        // Extract strings inside parentheses (Tj / TJ operators)
        const innerMatches = decompText.matchAll(/\(([^\\)]|\\.)*\)\s*(?:Tj|'|")/g);
        for (const im of innerMatches) {
          const val = im[0]
            .replace(/^\(/, '')
            .replace(/\)\s*(?:Tj|'|")$/, '')
            .replace(/\\([()\\])/g, '$1')
            .trim();
          if (val.length > 0) {
            textTokens.push(val);
          }
        }

        // Also extract array TJ strings: [(First) 10 (Second)] TJ
        const arrayTJ = decompText.matchAll(/\[(.*?)\]\s*TJ/g);
        for (const atj of arrayTJ) {
          const parts = atj[1].matchAll(/\(([^\\)]|\\.)*\)/g);
          for (const p of parts) {
            const val = p[0].slice(1, -1).replace(/\\([()\\])/g, '$1').trim();
            if (val.length > 0) textTokens.push(val);
          }
        }
      } catch {
        // stream was not standard zlib or was image data, ignore
      }
    }
  } catch (err) {
    console.error('Error during fallback PDF stream parsing:', err);
  }

  return textTokens.join(' ');
}

// Enterprise Invoice Extraction Endpoint powered by Gemini API
app.post('/api/extract-invoice', async (req, res) => {
  const startTime = Date.now();
  try {
    const { fileBase64, mimeType, filename } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 payload is required' });
    }

    // Clean base64 string
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const cleanMimeType = mimeType || (filename?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    // 1. Attempt High-Fidelity Extraction via Google Gemini (gemini-3.8-flash)
    if (ai) {
      try {
        const prompt = `You are a strict, enterprise-grade Accounts Payable invoice processing AI engine for SAP ECC accounting.
Analyze this invoice document thoroughly (including all pages, headers, tabular line item rows, tax breakdowns, totals, vendor details, and currency symbols).

Extract the complete invoice metadata into strictly valid JSON matching this schema:
{
  "invoice_number": "string (e.g. INV-2026-9042 or BOOK-1049, or bill number. Do not fabricate)",
  "invoice_date": "YYYY-MM-DD (invoice issue date)",
  "posting_date": "YYYY-MM-DD (default to invoice_date or current date 2026-09-29)",
  "vendor_name": "string (The genuine organization, book seller, publisher, or company issuing this invoice. NEVER output file headers like '%PDF-1.4', 'Adobe', 'Scanner', or 'PDF')",
  "vendor_tax_id": "string or null (GSTIN, PAN, VAT, TIN, or EIN if visible)",
  "vendor_code": "string or null (e.g. 100000 or ERP vendor code)",
  "currency": "string (ISO 3-letter currency code, e.g. INR, USD, EUR, GBP, AED, SGD. If in India or ₹ or Rs., use INR)",
  "taxable_value": number or null (Net taxable amount before tax),
  "tax_code": "string (e.g. GST18, GST12, GST5, V1, or EXEMPT)",
  "tax_amount": number or null (Calculated tax sum, GST, VAT),
  "total_cost": number (Final gross total payable amount on the invoice),
  "expense_category": "string (e.g. BOOKS_PUBLICATIONS, SUBSCRIPTIONS, OFFICE_SUPPLIES, CONSULTING, FREIGHT, HARDWARE, UTILITIES)",
  "company_code": "1000",
  "cost_center": "CC100",
  "gl_account_code": "600100",
  "remarks": "string or null (Brief line summary or invoice subject)",
  "raw_text": "string (Complete readable text extracted from all pages of the document)",
  "confidence_scores": {
    "invoice_number": number (0-100),
    "invoice_date": number (0-100),
    "vendor_name": number (0-100),
    "total_cost": number (0-100),
    "tax_amount": number (0-100)
  },
  "line_items": [
    {
      "description": "string (Item description or title)",
      "quantity": number,
      "unit_of_measure": "EA",
      "unit_price": number,
      "line_net_amount": number,
      "tax_code": "string",
      "tax_rate": number,
      "tax_amount": number,
      "cost_center_code": "CC100",
      "gl_account_code": "600100"
    }
  ]
}

CRITICAL RULES:
1. Zero hallucination: If an amount, tax, or date is not stated, return null.
2. Under NO circumstance should 'vendor_name' contain '%PDF' or technical file headers. Look for the company or entity at the top of the invoice.
3. For amounts, return standard numeric values (e.g. 4500.00, not '₹4,500.00').
4. If line items exist in a table, extract all line items with quantity, unit price, and net amount.
5. Return ONLY the raw JSON object. Do not include markdown \`\`\`json wrappers.`;

        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
        let lastError: any = null;
        let successfulModel = '';
        let parsed: any = null;

        for (const candidate of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: candidate,
              contents: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: cleanMimeType,
                  },
                },
                {
                  text: prompt,
                },
              ],
              config: {
                responseMimeType: 'application/json',
              },
            });

            const responseText = response.text || '';
            const cleanedJson = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            parsed = JSON.parse(cleanedJson);
            successfulModel = candidate;
            break;
          } catch (modelErr: any) {
            lastError = modelErr;
            console.warn(`Model ${candidate} failed with ${modelErr?.status || modelErr?.message}, trying next...`);
          }
        }

        if (parsed) {
          // Sanitize vendor_name to prevent file header artifacts
          if (
            !parsed.vendor_name ||
            parsed.vendor_name.startsWith('%PDF') ||
            parsed.vendor_name.includes('/Type') ||
            parsed.vendor_name.includes('<<') ||
            /^(pdf|adobe|scanner|document|untitled)/i.test(parsed.vendor_name)
          ) {
            parsed.vendor_name = filename ? filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : 'Verified Invoice Vendor';
          }

          return res.json({
            success: true,
            source: successfulModel,
            duration_ms: Date.now() - startTime,
            data: parsed,
          });
        } else if (lastError) {
          console.warn('All Gemini candidate models failed, falling back to local extractor:', lastError?.message || lastError);
        }
      } catch (err: any) {
        console.warn('Gemini extraction block failed:', err?.message || err);
      }
    }

    // 2. Fallback Deterministic Local Extractor (if Gemini is unavailable or failed)
    const fileBuffer = Buffer.from(cleanBase64, 'base64');
    const extractedRawText = extractTextFromPdfBuffer(fileBuffer);

    // Regex extraction
    const invMatch = extractedRawText.match(/(?:invoice|inv|bill|receipt|statement|ref|folio)[\s#.:-]*([A-Za-z0-9\-_/]{3,30})/i);
    const dateMatch = extractedRawText.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
    const amountMatch = extractedRawText.match(/(?:total|gross|amount\s*due|grand\s*total|balance\s*due|payable)[\s$€£:—=-]*([0-9,]+\.[0-9]{2})/i);
    const taxMatch = extractedRawText.match(/(?:tax|vat|gst|mwst)[\s$€£:\(0-9%)]*([0-9,]+\.[0-9]{2})/i);

    let currency = 'INR';
    if (/\$|USD/i.test(extractedRawText)) currency = 'USD';
    else if (/€|EUR/i.test(extractedRawText)) currency = 'EUR';
    else if (/£|GBP/i.test(extractedRawText)) currency = 'GBP';

    const fallbackTotal = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0.0;
    const fallbackTax = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0.0;

    let fallbackVendor = filename ? filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : 'Invoice Vendor';

    return res.json({
      success: true,
      source: 'local-fallback',
      duration_ms: Date.now() - startTime,
      data: {
        invoice_number: invMatch ? invMatch[1].trim() : (filename ? filename.replace(/\.[^/.]+$/, '') : `INV-${Date.now().toString().slice(-6)}`),
        invoice_date: dateMatch ? dateMatch[1] : new Date().toISOString().substring(0, 10),
        posting_date: new Date().toISOString().substring(0, 10),
        vendor_name: fallbackVendor,
        vendor_tax_id: null,
        vendor_code: '100001',
        currency,
        taxable_value: fallbackTotal > fallbackTax ? fallbackTotal - fallbackTax : fallbackTotal,
        tax_code: fallbackTax > 0 ? 'GST18' : 'EXEMPT',
        tax_amount: fallbackTax,
        total_cost: fallbackTotal,
        expense_category: 'GENERAL',
        company_code: '1000',
        cost_center: 'CC100',
        gl_account_code: '600100',
        remarks: filename,
        raw_text: extractedRawText || 'Text extracted from artifact streams',
        confidence_scores: {
          invoice_number: invMatch ? 85 : 50,
          invoice_date: dateMatch ? 85 : 50,
          vendor_name: 70,
          total_cost: amountMatch ? 85 : 40,
          tax_amount: taxMatch ? 85 : 40,
        },
        line_items: [
          {
            description: filename ? filename.replace(/\.[^/.]+$/, '') : 'Invoice Item',
            quantity: 1,
            unit_of_measure: 'EA',
            unit_price: fallbackTotal > fallbackTax ? fallbackTotal - fallbackTax : fallbackTotal,
            line_net_amount: fallbackTotal > fallbackTax ? fallbackTotal - fallbackTax : fallbackTotal,
            tax_code: 'GST18',
            tax_rate: 18,
            tax_amount: fallbackTax,
            cost_center_code: 'CC100',
            gl_account_code: '600100',
          },
        ],
      },
    });
  } catch (error: any) {
    console.error('Unhandled invoice extraction error:', error);
    return res.status(500).json({ error: error?.message || 'Invoice extraction failed' });
  }
});

// Dev vs Production server setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`InvoiceFlow enterprise server listening at http://0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
