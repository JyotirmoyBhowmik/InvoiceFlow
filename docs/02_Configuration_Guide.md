# InvoiceFlow Configuration & Field Customization Guide

---

## 1. Metadata Field Customization & Dynamic Propagation

InvoiceFlow contains **zero hard-coded field names**. The database table `field_definition` is the central source of truth for:
1. Dynamic UI form rendering on the Review Workbench.
2. Generating the JSON extraction schema (`response_schema`) sent to AI providers.
3. Header and line item validation rules.
4. SAP ECC FB60 column mapping in generated CSV and TXT files.

---

## 2. End-to-End Walkthrough: Renaming a Field

### Objective
Rename standard field `tax_code` to `vat_rate_indicator`, adjust its UI label to `VAT Tax Indicator`, and observe how it flows across all system components with **zero code modifications**.

### Step 1: Update in Admin Console
1. Navigate to **Metadata & Logic > Dynamic Field Definitions**.
2. Locate row with Field Key: `tax_code`.
3. Click the **Edit (pencil)** icon.
4. Modify properties:
   - **Field Key**: `vat_rate_indicator`
   - **Display Label**: `VAT Tax Indicator`
   - **AI Prompt Hint**: `Extract 2-character tax code indicator (e.g. V0, V1, I1)`
   - **Export Column Name**: `MWSKZ` (SAP ECC tax field)
5. Click **Save (checkmark)**.

### Step 2: Verification of Immediate End-to-End Propagation

1. **AI Prompt Engine**: Open **Intelligence & Ingest > AI Provider & Prompts**. Inspect the *Runtime Generated JSON Schema* card. The property key has updated immediately:
   ```json
   {
     "properties": {
       "vat_rate_indicator": {
         "type": "string",
         "description": "Extract 2-character tax code indicator (e.g. V0, V1, I1)"
       }
     }
   }
   ```
2. **Review Workbench**: Open **Operations > Review & Correction**. In the right-hand panel, notice the field label now reads `VAT Tax Indicator`, binds to key `vat_rate_indicator`, and displays bounding box coordinates without altering any JSX template.
3. **SAP ECC Export File**: Open **Intelligence & Ingest > SAP Profile Designer**. The mapping for SAP column `MWSKZ` now references `vat_rate_indicator` as its source field key. The generated CSV and fixed-width TXT files correctly pull data from this attribute.

---

## 3. Declarative Rule Builder Syntax & AST Reference

Business rules are stored in `rule.condition_tree` as declarative JSON ASTs without dynamic evaluation (`eval` is forbidden).

### Supported Comparison Operators

| Operator | Syntax | Description | Example |
|---|---|---|---|
| Equality | `==` | Exact string/numeric match | `{"field": "currency", "op": "==", "value": "USD"}` |
| Inequality | `!=` | Value mismatch | `{"field": "company_code", "op": "!=", "value": "9999"}` |
| Numerical Comparison | `>`, `>=`, `<`, `<=` | Numeric magnitude checks | `{"field": "total_cost", "op": ">", "value": 5000}` |
| Substring Contains | `contains` | Case-insensitive text inclusion | `{"field": "vendor_name", "op": "contains", "value": "Hotel"}` |
| Emptiness | `is_empty` | Checks if field is null/empty | `{"field": "tax_code", "op": "is_empty", "value": ""}` |

### Compound Condition Logic
Rules support arbitrary boolean nesting via `"and"` and `"or"` arrays:

```json
{
  "and": [
    { "field": "expense_category", "op": "==", "value": "HOTEL" },
    {
      "or": [
        { "field": "country_code", "op": "==", "value": "USA" },
        { "field": "total_cost", "op": ">", "value": 500.0 }
      ]
    }
  ]
}
```

### Action Mutation Block
When conditions are met, the action set mutates document fields:

```json
{
  "set_fields": {
    "tax_code": "V1",
    "gl_account_code": "600200",
    "cost_center": "CC100"
  }
}
```

---

## 4. Processing Streams Configuration (Part A)

InvoiceFlow organizes document flows into configurable processing streams stored in `processing_stream`. Adding a stream is purely a data operation:

### 4.1 Core Stream Profiles
1. **Stream A (`STREAM_A_ITH_TRAVEL`):** Travel-Agency / ITH corporate invoices for vendor payment.
   - Subcategories: `HOTEL`, `AIRLINE`, `TRAIN`, `CAB`, `GENERAL`.
   - Mandatory field matrices configured per subcategory.
   - Trip ID handling: Validated against `trip_reference`. If absent, linked via fallback keys (employee + travel dates + route); logged as `WARN` without blocking the workflow.
2. **Stream B (`STREAM_B_AIRLINE_TAX_CREDIT`):** Airline-issued tax invoices used strictly for VAT/GST input tax credit claims.
   - Extracts PNR, e-ticket number, flight sector, passenger name, and customer tax ID.
   - Cross-stream link (`VAL_STREAM_DOUBLE_CLAIM`): Automatically matches tickets previously billed under Stream A to prevent duplicate expense claims while enabling valid tax asset recovery.

---

## 5. Tax Regimes Master & Nepal VAT 13% Configuration (Part D.2, Part E)

Tax calculation is regime-driven via `tax_regime`:

| Regime Code | Country | Tax Type | Standard Rate | Identifier Format | Checksum Algorithm | Input Tax Claimable |
|---|---|---|---|---|---|---|
| `NEPAL_VAT` | NP | VAT | 13.00% | 9 Numeric Digits (`^\d{9}$`) | IRD Modulo 11 | Yes (Customer Nepal) |
| `INDIA_GST` | IN | GST | 5% / 12% / 18% | 15 Characters Alphanumeric | GSTIN Checksum | Configurable per entity |

---

## 6. Bikram Sambat (B.S.) Calendar Table (Part E.3)

Dates recorded in Bikram Sambat (e.g. `२०८३-०६-०८`) are converted to Gregorian A.D. and mapped to Nepal Fiscal Periods via the database table `bikram_sambat_calendar`:
- **Nepal Fiscal Year:** Starts on 1st Shrawan (mid-July).
- **Calendar Maintenance:** Finance administrators maintain upcoming calendar years via `master-import` CSV or the Admin Console. Hardcoded month lengths are strictly prohibited.

---

## 7. Master Import Profiles by Email (Part D.4)

Masters (Vendors, GL Accounts, Cost Centers, Profit Centers, Tax Codes) can be updated by emailing SAP CSV view exports to `masters@snpl.com.np`:
- **Safety Deactivation Threshold:** Configurable limit (default 10.0%). If a file would deactivate more than 10% of existing master records, the entire import is held for explicit SuperAdmin approval.
- **Rollback:** Every update generates an encrypted snapshot enabling one-click audit rollback.

---

## 8. Multi-Cloud AI Provider Profiles & Token Pricing (Part H.4, Part I.1)

Model profiles can be assigned per stream:
- `gemini-3.1-flash-lite`: Fast, ultra-reliable multimodal extraction for standard travel PDFs.
- `gemini-2.5-flash`: Legacy reference baseline model.
- `azure-openai`: Azure OpenAI / Foundry in Customer's dedicated Azure subscription for strict in-tenant residency.
- **Cost Profiling:** Pricing per 1M tokens is maintained in `ai_model_pricing` to benchmark real cost against the **15 paisa INR** reference metric.

