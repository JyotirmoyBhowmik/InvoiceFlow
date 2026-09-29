# InvoiceFlow — Test Plan & User Acceptance Testing (UAT) Script

**Target Audience**: QA Engineers, Business Analysts, Accounts Payable Project Leads  

---

## 1. Test Strategy Overview

The testing framework guarantees functional accuracy, financial balance integrity, and security hardening across 3 distinct test levels:
1. **Automated Unit Tests**: Rule engine condition evaluation, arithmetic balancing formulas, export profile padding/alignment.
2. **Integration Tests**: File ingestion -> Layer 1 Preprocessing -> Layer 2 OCR -> Layer 3 AI extraction -> Database persistence.
3. **User Acceptance Testing (UAT)**: 15 real-world end-to-end business scenarios.

---

## 2. 15-Case End-to-End UAT Test Script

| Test ID | Business Scenario | Steps to Execute | Expected Outcome | Pass/Fail |
|---|---|---|---|---|
| **UAT-01** | First Admin Access | Run `python -m app.cli create-admin`, log into UI on port 3000. | Superadmin created, forced password change prompted, lands on Dashboard. | PASS |
| **UAT-02** | Clean Master Data Setup | Open Dashboard with empty master data, launch Setup Wizard. | Guides user through 13 stages; saves valid company code and vendors. | PASS |
| **UAT-03** | Standard PDF Ingestion | Upload `Apex_Industrial_INV-2026-9042.pdf` via Ingest Modal. | Artifact registered with SHA-256 hash; OCR and AI extract invoice header. | PASS |
| **UAT-04** | Anti-Fabrication Check | Upload invoice missing tax ID and PO number. | Missing fields stamped `NOT_FOUND` (0% confidence); no dummy data invented. | PASS |
| **UAT-05** | Arithmetic Balancing | Ingest invoice where Line Items != Header Total. | System raises `VAL-002: Arithmetic mismatch`; blocks straight-through approval. | PASS |
| **UAT-06** | Vendor Identification | Ingest invoice matching vendor tax ID in Master Data. | Automatically resolves `vendor_code` and assigns default GL account. | PASS |
| **UAT-07** | Unknown Vendor Exception | Ingest invoice from unregistered vendor. | Raises `MSTR-001: Vendor identity not found in Master Data`; holds in Workbench. | PASS |
| **UAT-08** | Review Workbench Correction | AP clerk clicks on field in workbench and updates tax code to `V1`. | Field stamped `USER_CORRECTED`; audit log recorded in `process_log`. | PASS |
| **UAT-09** | Evidence Inspector Overlay | Click `total_cost` on right pane of Review Workbench. | Left pane highlights the corresponding bounding box on the original document. | PASS |
| **UAT-10** | Straight-Through Approval (STP) | Ingest flawless high-confidence invoice above threshold. | Auto-approved directly to `APPROVED` status without human intervention. | PASS |
| **UAT-11** | Batch Export Execution | Click "Generate SAP Batch" in Run Manager with approved invoices. | Generates compliant SAP FB60 CSV & fixed-width TXT with SHA-256 control total. | PASS |
| **UAT-12** | Batch Reversal | Click "Reverse Run" on an exported batch record. | Batch status marked `REVERSED`; invoices flagged for financial correction. | PASS |
| **UAT-13** | Mailbox Connection Test | Click "Test Graph Connection" in Mailbox Profiles. | Acquires token and verifies access to `Inbox/Invoices` folder. | PASS |
| **UAT-14** | Account Lockout | Enter incorrect password 5 times in login modal. | Account locked for 30 minutes; unlocked via `python -m app.cli unlock-user`. | PASS |
| **UAT-15** | Dynamic Field Configuration | Add custom field `project_code` in Field Definition Manager. | Appears instantly in extraction schema and Review Workbench right pane. | PASS |
