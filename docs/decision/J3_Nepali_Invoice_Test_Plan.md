# J3 — Nepali Invoice & Tax Regime Test Plan
**Document Reference:** `docs/decision/J3_Nepali_Invoice_Test_Plan.md`  
**Purpose:** Detailed technical and operational test plan verifying InvoiceFlow's capability to process Nepali-language invoices, Devanagari script, Bikram Sambat (B.S.) calendar dates, and Nepal VAT rules.  
**Applicability:** Customer (Surya Nepal Pvt. Ltd., SNPL) & Regional Invoices

---

## 1. Scope & Test Objectives

The reference solution was built for Indian corporate travel under Indian GST. Customer operates in Nepal under the Nepal Value Added Tax Act 2052, where:
1. Invoices are frequently written in Nepali (Devanagari script: नेपाली कर बिजक).
2. Quantities, rates, and amounts often use Devanagari numerals (`०, १, २, ३, ४, ५, ६, ७, ८, ९`).
3. Dates are recorded in Bikram Sambat (`वि.सं. २०८३/०६/०८`).
4. The legal tax identifier is a 9-digit PAN/VAT number (not a 15-character GSTIN).
5. Currency is Nepalese Rupee (NPR / रू / रु.).
6. Standard VAT is 13%, claimable strictly on tax-compliant VAT invoices.

---

## 2. Test Cases Specification

### Test Case NP-01: Devanagari Numerals Normalization
- **Objective:** Verify that all Devanagari digits (`०–९`) in amounts, room numbers, invoice numbers, and quantities are converted into standard Arabic digits (`0–9`) before calculation.
- **Input Sample:** `Hotel_Annapurna_NP.pdf` containing:  
  `कुल जम्मा रकम: २०,९०५.००` (Total: 20,905.00), `भ्याट १३%: २,४०५.००` (VAT: 2,405.00), `कोठा नं: १०४` (Room: 104).
- **Expected Result:**
  - Extracted Total Cost = `20905.00`
  - Extracted Tax Amount = `2405.00`
  - Extracted Taxable Base = `18500.00`
- **Pass Criteria:** Exact mathematical equality with zero string parse errors.

---

### Test Case NP-02: Nepal 9-Digit PAN/VAT Validation
- **Objective:** Verify recognition of 9-digit Nepal Permanent Account Numbers and rejection of invalid length or alphabetic characters.
- **Input Sample:** `स्थाई लेखा नम्बर (PAN / VAT No): ३०१२९४८५७`
- **Validation Rule:** Regex `^\d{9}$` after Devanagari normalization.
- **Expected Result:**
  - Extracted Tax ID = `301294857`
  - Validation code `MSTR_VENDOR_RESOLVED_BY_PAN` triggered.
  - Vendor successfully mapped in vendor master.
- **Pass Criteria:** Tax identifier recognized without truncation.

---

### Test Case NP-03: Bikram Sambat (B.S.) Date Conversion
- **Objective:** Verify conversion of B.S. dates to Gregorian A.D. dates and derivation of Nepal fiscal periods via database calendar table.
- **Input Sample:** `बिजक मिति: २०८३-०६-०८` (Ashwin 8, 2083 B.S.)
- **Expected Result:**
  - Standardized Invoice Date (A.D.) = `2026-09-24`
  - Original B.S. Date preserved = `2083-06-08`
  - Nepal Fiscal Year = `2083/84`
  - Nepal Fiscal Period = `3` (Shrawan=1, Bhadra=2, Ashwin=3)
- **Pass Criteria:** Both Gregorian and Bikram Sambat dates saved with accurate fiscal period mapping.

---

### Test Case NP-04: Nepal VAT 13% Arithmetic Reconciliation
- **Objective:** Verify deterministic tax calculation for standard Nepal 13% VAT.
- **Formula:**  
  $$\text{Expected VAT} = \text{Taxable Base} \times 0.13$$  
  $$\text{Gross Total} = \text{Taxable Base} + \text{Expected VAT}$$
- **Input Sample:** Base = NPR `18,500.00`, VAT = NPR `2,405.00`, Total = NPR `20,905.00`.
- **Expected Result:**
  - Difference between calculated VAT and document VAT <= 0.05.
  - Document status flagged as `APPROVED` (or straight-through if confidence >= threshold).
- **Negative Test:** Base = NPR `18,500.00`, VAT printed as NPR `2,100.00`.
  - System must raise `TAX_VAT13_RECON_MISMATCH` with severity `BLOCK` and route to Exception Queue.

---

### Test Case NP-05: Mixed-Language Regional Corporate Invoices
- **Objective:** Verify invoices containing English headers with Nepali item descriptions and currency notations.
- **Input Sample:** `TAX INVOICE — Kathmandu Guest House (काठमाडौं गेस्ट हाउस), Room Stay रु ४,५००, Service Tax रु ५८५`.
- **Expected Result:**
  - Correct currency assignment: `NPR`
  - Vendor Name: `Kathmandu Guest House`
  - Total: `5085.00`

---

### Test Case NP-06: Handwritten Regional Travel Bills & Carbon Duty Slips
- **Objective:** Verify routing of handwritten taxi / hotel slips to dedicated manual-review profile.
- **Input Sample:** Handwritten Nepali receipt from local vehicle vendor.
- **Expected Result:**
  - System recognizes `is_handwritten = TRUE`.
  - Auto-approve threshold raised to 99.0% (forcing human exception review).
  - Status set to `REVIEW_PENDING` with reason `Handwritten document detected; mandatory human controller verification required`.

---

## 3. Test Execution & Reporting Schedule

| Milestone | Responsible | Target Date | Output |
|---|---|---|---|
| Sample Collection (15-20 Nepali bills) | Customer Finance (Saurabh) | Week 1 | Encrypted ZIP of real samples |
| Ground Truth Entry | Nitesh & Saurabh | Week 2 | Ground truth records logged in DB |
| Automated Harness Run | Developer & Nitesh | Week 2 | `J2_Feasibility_Report` generated |
| Final Accuracy Sign-Off | Vinod & Dipendra | Week 3 | Formal Go/No-Go Decision |
