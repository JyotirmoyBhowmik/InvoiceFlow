# InvoiceFlow — End-User Guide (Email-First Operating Model)

**Target Audience:** Corporate Employees, Travel Desks, Vendors, Accounts Payable Controllers  
**Operating Principle:** End-users **never log into a web portal**. Invoices are submitted exclusively via email, and validated outputs (SAP posting files & MIS packages) are returned directly via email.

---

## 1. Operating Model Overview

InvoiceFlow operates as an unattended, headless email processing service:

```
[Employee / Vendor] emails invoice attachment(s)
       │
       ▼
[Dedicated Stream Mailbox] (e.g. travel.invoices@snpl.com.np)
       │
       ▼
[Autonomous Scheduler Run] (Hourly :00 cycle)
       │
       ├─► Extract text & layout (OCR + Multimodal AI)
       ├─► Validate fields against SAP Master Tables & Tax Regimes
       ├─► Reconcile arithmetic & tax (Nepal VAT 13% / Indian GST)
       └─► Generate SAP-ready batch file & MIS package ZIP
       │
       ▼
[Threaded Return Email] dispatched to sender & finance controllers (~:15 past the hour)
```

**Service Level Target:** An invoice received by **11:30** is processed in the **12:00** run, and the result is returned by approximately **12:15**.

---

## 2. Where to Send Invoices: Stream Mailboxes

InvoiceFlow routes documents into specialized processing streams based on the receiving mailbox:

| Processing Stream | Dedicated Email Address | Supported Invoices | Key Output Returned |
|---|---|---|---|
| **Stream A: Travel Agency / ITH** | `travel.invoices@snpl.com.np` *(or `travel@enterprise.internal`)* | Hotel stays, domestic/international flights, local cab duty slips, train bookings billed by travel agency | SAP Vendor Invoice Posting File + Run MIS Package |
| **Stream B: Airline Tax Invoices** | `airline.gst@snpl.com.np` *(or `airline.tax@enterprise.internal`)* | Airline-issued tax invoices used strictly for VAT/GST tax credit claims (IndiGo, Buddha Air, Yeti, Air India) | Tax Credit Input Register + SAP Tax Posting Batch |
| **Master Updates Mailbox** | `masters@snpl.com.np` | SAP CSV exports of Vendor, GL, Cost Center, or Profit Center updates *(Finance Admins only)* | Import Diff Report & Audit Snapshot |

---

## 3. Attachment & File Rules

To ensure rapid, straight-through processing:

1. **Accepted File Formats:**
   - **PDF:** Native digital PDFs or clean 300 DPI scanned documents (single or multi-page).
   - **Images:** High-contrast `PNG`, `JPEG`, or `WEBP` photos of receipts.
   - **ZIP Archives:** Bundles containing multiple invoice PDFs/images.
2. **Language & Script Support:**
   - Standard English invoices.
   - **Nepali (Devanagari script) tax invoices** (नेपाली कर बिजक, Devanagari numerals `०–९`).
   - Dates in Gregorian (A.D.) or **Bikram Sambat (B.S.)** (e.g. `२०८३/०६/०८`).
3. **Trip ID Guidelines:**
   - Invoices may be submitted **with or without a Trip ID**.
   - If booked without a Trip ID, provide traveler employee code and travel dates in the email subject or body to allow automated fallback linking.
4. **Multiple Invoices in One Email:**
   - You may attach multiple invoices to a single email. The system parses each attachment independently and provides a file-by-file status breakdown in the reply.

---

## 4. Understanding the Processing Reply Email

Every email submission receives a reply in the **same email thread** containing:

### 4.1 Processing Status Summary (Header)
```text
INVOICEFLOW PROCESSING RESULT — BATCH RUN #RUN-20260930-1002
Stream: Stream A (Travel-Agency / ITH Corporate Travel)
Submission Received: 2026-09-30 11:28:14 UTC
Result Returned:     2026-09-30 12:12:04 UTC (Latency: 43.8 seconds processing)

SUMMARY OF ATTACHMENTS (3 FILES SUBMITTED):
[1] Hotel_Annapurna_HA-2083-0492.pdf       : ACCEPTED  (Confidence: 97.4%, STP Approved)
[2] IndiGo_Air_Ticket_6E-W8Q29.pdf         : ACCEPTED  (Confidence: 96.8%, STP Approved)
[3] Local_Cab_DutySlip_DS-4019.pdf         : EXCEPTION (Confidence: 84.2%, Review Pending)
```

### 4.2 Status Categories & Meaning:
- **`ACCEPTED`**: Document passed all validation rules, tax calculations reconciled, and the record is queued for SAP batch posting.
- **`EXCEPTION`**: Document requires clarification (e.g. imbalanced math, unmapped vendor tax ID, or low scan clarity). A clear plain-language remediation note is provided.
- **`REJECTED`**: Document is invalid (e.g. duplicate submission, corrupted file, or non-invoice attachment).

### 4.3 Email Attachments Provided:
1. **SAP-Ready Posting File** (`SAP_POSTING_BATCH_*.csv` / `.txt`): Ready for batch upload to SAP ECC.
2. **Comprehensive MIS Package** (`MIS_PACKAGE_RUN_*.zip`):
   - `invoices/processed/`: Standardized, renamed copies of approved bills (`{vendor_code}_{invoice_no}_{invoice_date}.pdf`).
   - `invoices/exceptions/`: Invoices routed to finance exception review.
   - `mis_register.tsv`: Full Excel/tab-separated tracking register with all fields and AI token cost.
   - `run_control_sheet.txt`: Debit/credit balance check matching SAP totals.

---

## 5. How to Handle Exceptions & Resubmissions

If an invoice receives an `EXCEPTION` status:

1. **Review the Plain-Language Remediation Note:**
   - *Example:* `Error VAL_VENDOR_NOT_FOUND: Tax ID 301294857 extracted from document is not yet registered in SAP vendor master.`
   - *Example:* `Error VAL_ARITHMETIC_MISMATCH: Base amount (NPR 18,500) + 13% VAT (NPR 2,405) does not balance with Total (printed NPR 22,000).`
2. **Correct the Issue:**
   - Obtain a corrected invoice from the vendor or have Finance update the vendor master table.
3. **Resubmit by Replying to the Same Email Thread:**
   - Simply attach the corrected invoice PDF and reply in the same thread.
   - **Automated Resubmission Recognition:** InvoiceFlow detects matching vendor and invoice numbers, **superseding the earlier exception** rather than creating a duplicate invoice record.

---

## 6. Accessing the Web Workbench (Controllers & Admins Only)

The Web Review Workbench (`/workbench`) is reserved for Finance Controllers and Exception Reviewers:
- View high-fidelity source document scans alongside extracted fields.
- Review bounding box spatial provenance.
- Overrule exceptions, edit values (stamped `USER_CORRECTED`), or approve low-confidence bills.
- Download historical MIS ZIP packages from the Run Manager.
