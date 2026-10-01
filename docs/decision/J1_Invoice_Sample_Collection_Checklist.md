# J1 — Customer Invoice Sample Collection Checklist
**Document Reference:** `docs/decision/J1_Invoice_Sample_Collection_Checklist.md`  
**Purpose:** Actionable checklist for Customer Finance and ITD teams to assemble representative, real-world invoice samples for accuracy benchmarking in the InvoiceFlow Evaluation Harness.  
**Classification:** Confidential — Financial & Operational Audit Material

---

## 1. Executive Summary & Objective

To properly evaluate InvoiceFlow against Customer's operational travel and tax-credit requirements, Customer is assembling a representative test collection of real invoice documents. 

**Core Principle:** No fabricated or mock data. The evaluation harness tests actual vendor layouts, fonts, paper scans, and tax formats to establish an empirical baseline (targeting 95–98% straight-through processing).

---

## 2. Sample Collection Matrix & Target Counts

| # | Processing Stream | Sub-Category / Vendor Type | Format & Medium | Language & Date | Currency | Target Count |
|---|---|---|---|---|---|---|
| **1** | **Stream A (Travel Agency / ITH)** | Hotel Booking (e.g. Hotel Annapurna, Soaltee, Yak & Yeti) | Digital PDF / E-Invoice | English (A.D. dates) | NPR | 15–20 |
| **2** | **Stream A (Travel Agency / ITH)** | Hotel Booking (Local Nepal Regional) | Scanned Paper Bill | Nepali (Devanagari, B.S. dates) | NPR | 15–20 |
| **3** | **Stream A (Travel Agency / ITH)** | Consolidated Travel Desk (ITH / Local Agency) | Digital Multi-Page PDF | English (A.D. dates) | INR / NPR | 20–25 |
| **4** | **Stream A (Travel Agency / ITH)** | Local Cab / Taxi / Vehicle Rental Duty Slip | Printed Slip / Carbon Copy | Mixed (English/Devanagari) | NPR | 15–20 |
| **5** | **Stream A (Travel Agency / ITH)** | Railway / IRCTC Train Booking | E-Ticket PDF | English (A.D. dates) | INR | 10–15 |
| **6** | **Stream B (Airline Tax Invoices)** | Nepal Domestic Airlines (Buddha Air, Yeti Airlines) | Digital PDF / IRD E-Billing | English + Devanagari (PAN 9-digit) | NPR | 20–25 |
| **7** | **Stream B (Airline Tax Invoices)** | Indian Cross-Border Airlines (IndiGo, Air India, Vistara) | Digital PDF (GSTIN 15-char) | English (GST credit ITC format) | INR | 25–30 |
| **8** | **Edge & Stress Testing** | Handwritten Manual Bills (Guest house, local cab, petty travel) | Photo / Mobile Cam Scan | Handwritten Nepali & English | NPR | 15–20 |
| **9** | **Edge & Stress Testing** | Poor-quality Scans (Skewed > 5°, low contrast, 150 DPI) | Scanned TIF / PDF | Any | NPR / INR | 10–15 |
| **10**| **Edge & Stress Testing** | Multi-Invoice Bundles (Single PDF containing 2–5 distinct bills) | Merged PDF / ZIP package | Mixed | Any | 5–10 |

**Total Recommended Sample Size:** **160–200 unique real invoices** across 30+ distinct vendors.

---

## 3. Specific Field Verification Points per Sample

Every collected invoice sample must ideally have visibility of the following key fields:
1. **Invoice Header:** Invoice Number, Bill Number, or Folio Number.
2. **Dates:** Issue Date (Gregorian A.D. or Bikram Sambat B.S. format `YYYY-MM-DD` or `YYYY/MM/DD`).
3. **Vendor Details:** Legal Business Name, Address, and Tax Identifier (Nepal 9-digit PAN/VAT or Indian 15-char GSTIN).
4. **Customer / Billed-To Details:** Customer legal entity name (e.g. Surya Nepal Pvt. Ltd. / ITC Limited) and company code.
5. **Travel Particulars (when applicable):**
   - Trip ID or Travel Request Reference (note if invoice was booked without Trip ID).
   - Passenger / Guest Name.
   - PNR or E-Ticket Number.
   - Travel Sector / Route (e.g. KTM–PKR, DEL–BOM, CCU–DEL).
6. **Financial Breakdown:**
   - Net Taxable Base Amount.
   - Value Added Tax (VAT 13%) or Goods & Services Tax (GST 5% / 12% / 18%).
   - Gross Total Payable Amount.

---

## 4. Mandatory Data Handling & Security Protocol

> **CRITICAL SECURITY & COMPLIANCE NOTICE:**  
> Invoice samples contain genuine corporate expenditure records, personal identifiable information (PII) of travelers/employees, and tax identifiers. Strict handling protocols must be observed:

1. **Approved Transmission Channels Only:**
   - **Do NOT** send samples via unencrypted public channels or personal chat applications.
   - Transmit files via password-protected ZIP archive uploaded to Customer's designated secure SharePoint / OneDrive folder or an encrypted SFTP channel.
2. **Access Control:**
   - Access to sample files is strictly restricted to designated evaluation engineers (Vinod, Nitesh, and developer).
3. **Evaluation Sandbox Isolation:**
   - Samples ingested into the Evaluation Harness are flagged with `sandbox_mode = TRUE`.
   - **Zero SAP Export:** Sandbox records are blocked from generating SAP production posting batches.
   - **Zero Live Email Dispatch:** Return notifications are silenced or routed exclusively to evaluation test mailboxes.
4. **Data Retention & Disposal:**
   - Upon completion of the Part G accuracy benchmark and sign-off of the J2 Feasibility Assessment, all un-redacted sample files must be purged from local test environments in accordance with corporate data retention policies.
