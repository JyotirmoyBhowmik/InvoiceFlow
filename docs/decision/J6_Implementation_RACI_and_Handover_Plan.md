# J6 — Implementation RACI Matrix and Knowledge Transfer Handover Plan
**Document Reference:** `docs/decision/J6_Implementation_RACI_and_Handover_Plan.md`  
**Purpose:** Formal responsibility assignment matrix and step-by-step knowledge transfer plan for transitioning InvoiceFlow to Customer internal ownership.  
**Key Personnel:** Vinod (Customer Lead), Nitesh (Customer Python Engineer), Dipendra & Saurabh (Customer Finance/Business), Developer (Solution Architect & Mentor)

---

## 1. RACI Responsibility Assignment Matrix

*Definitions: **R** = Responsible (completes the work), **A** = Accountable (final decision & sign-off), **C** = Consulted (provides input), **I** = Informed (receives status)*

| Project Deliverable / Phase | Customer Finance (Dipendra/Saurabh) | Customer IT (Vinod) | Customer Developer (Nitesh) | Solution Architect (Developer) | ITD / DMM Stakeholders |
|---|:---:|:---:|:---:|:---:|:---:|
| **Sample Invoice Collection (J1 Checklist)** | **R / A** | C | C | C | I |
| **Ground-Truth Data Entry & Verification** | **R** | C | **R** | C | I |
| **Accuracy Benchmarking (J2 Report)** | C | A | **R** | **R** | I |
| **Nepal VAT & Devanagari Validation Sign-off** | **A** | C | R | C | I |
| **Customer Azure Tenant Infrastructure Provisioning** | I | **A** | **R** | C | I |
| **Codebase Handover & Architecture Walkthrough** | I | I | **R** | **R / A** | I |
| **Master Data Export & Email Pipeline Setup** | **R** | C | **R** | C | I |
| **SAP ECC File Integration & Testing (SFTP/CSV)** | **R** | **A** | **R** | C | C |
| **New Invoice Format Fine-Tuning & Prompt Adjustments** | C | I | **R / A** | C (Advisory) | I |
| **Production Go-Live Decision** | **A** | **A** | C | C | **A** |

---

## 2. Knowledge-Transfer Handover Plan (5-Day Structured Program)

Developer will provide dedicated knowledge transfer to Nitesh to ensure complete self-sufficiency in maintaining, troubleshooting, and extending InvoiceFlow:

### Day 1: Architecture & Data Model Deep Dive
- Review of the ~16 core database tables (Streams, Subcategories, Masters, Invoices, Line Items, Rules).
- Application-layer architecture: Why business logic resides in Python/TypeScript rather than database stored procedures/triggers (ensuring portability between PostgreSQL, Azure SQL, and MySQL).
- Headless execution model: `python -m app.cli serve-worker` and `run-once`.

### Day 2: Multimodal AI & Prompt Engineering
- Anatomy of the enterprise extraction prompt (JSON schema enforcement, zero-markdown output).
- Managing multi-provider endpoints: `gemini-3.1-flash-lite`, `gemini-2.5-flash`, Azure OpenAI, and fallback text prompts.
- Token and latency profiling: Monitoring costs against the 15 paisa benchmark.

### Day 3: Deterministic Rule Engine & Master Data Updates
- Designing business rules in `rule_engine.py` (AST condition trees: GL resolution, Section Code 194C/194J, Tax Code mapping).
- Operating the email-based master update pipeline (`master_import_service.py`):
  - Ingesting SAP CSV views for Vendors, GLs, Cost Centers, and Profit Centers.
  - Inspecting automated diff reports and handling safety deactivation thresholds.

### Day 4: Customer Nepal Localization & Exception Handling
- Troubleshooting Devanagari OCR and numeral normalization.
- Maintaining the `bikram_sambat_calendar` table for upcoming fiscal years.
- Operating the human exception review workflow in the Admin Workbench (`Workbench.tsx`).

### Day 5: Operational Runbook, Evaluation Harness & Handover Sign-off
- Running the Accuracy Evaluation Harness (`app.cli eval run`).
- Configuring scheduled email replies and Graph API mailboxes.
- Disaster recovery, secret rotation (`app.cli rotate-secret`), and log monitoring.

---

## 3. Maintenance & Ongoing Fine-Tuning Procedure

When Customer onboard a new airline, regional hotel, or transport vendor:
1. **Sample Ingestion:** Ingest 3–5 representative sample bills into the Evaluation Harness set.
2. **Field Verification:** Confirm if the vendor tax identifier (PAN/GSTIN) is extracted with confidence >= 95%.
3. **Master Entry:** If vendor code is not automatically resolved, add the vendor tax ID and SAP vendor code to the vendor master via the master-update mailbox.
4. **Prompt Calibration:** If the invoice layout is highly complex (e.g. multi-passenger consolidated duty slip), add an alias or specialized bounding hint in the subcategory matrix without altering core engine code.
