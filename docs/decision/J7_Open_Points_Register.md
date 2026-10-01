# J7 — Open Points & Assumptions Register
**Document Reference:** `docs/decision/J7_Open_Points_Register.md`  
**Purpose:** Comprehensive tracking register of all ambiguous items (**[CONFIRM]**), technical assumptions, and pending decisions identified during reference solution review.  
**Policy:** Every item is built as **configurable** in InvoiceFlow code — zero hardcoded assumptions.

---

## 1. Open Points & Confirmation Matrix

| # | Item Description | Source Ambiguity / [CONFIRM] Tag | Current Code Implementation (Configurable) | Decision Needed From | Owner | Impact if Unresolved / Default Action |
|---|---|---|---|---|---|---|
| **OP-01** | **Tax Regime & Input-Tax Credit Claimability** | Meeting notes refer to Indian GST credits, but Customer operates in Nepal under Nepal VAT. Can Customer (a Nepal entity) claim Indian GST on cross-border travel, or is it treated as gross expense? | Configured `tax_regime` master with regime flag `input_tax_claimable = TRUE/FALSE`. If False, tax amount is posted as expense. | Customer Finance (Dipendra / Saurabh) | Finance Controller | **Default:** Post Indian GST to travel expense without separate tax asset credit unless Finance confirms bilateral claimability. |
| **OP-02** | **"Call Center" vs Profit Centre** | Notes state: *"The application uses master tables for vendor code... tax code, call center, and cost center."* Standard SAP ECC CO accounting uses **Profit Center** (PRCTR), not "call center". | Implemented `profit_center` table and mapped field `profit_center_code`. System treats "call center" as configurable alias for Profit Center. | Customer SAP ERP Core Team | Vinod | **Default:** Retain Profit Center mapping with alias support; zero disruption to SAP standard structure. |
| **OP-03** | **HR / Employee Master Source ("Happy")** | Reference solution enriches travel data from user system named "Happy". Is Happy an internal portal, SAP HR, or a third-party HRMS? | Built pluggable `employee_source` adapter accepting CSV by email, SFTP view, REST API, or SAP HR dump. | Customer IT / HR Team | Nitesh | **Default:** Accept daily automated employee CSV export via dedicated master mailbox (`masters@snpl.com.np`). |
| **OP-04** | **SAP Posting Integration & Licensing** | Notes discuss automated posting vs file upload. Direct RFC/BAPI posting into SAP ECC can trigger **SAP Digital / Indirect Access licensing fees**. | File-based output (CSV/TXT) is the primary default. Direct BAPI/RFC adapter is present but **explicitly disabled by default**. | Customer IT Management & SAP Licensing Lead | Vinod | **Default:** Keep direct posting disabled. Operate via standard batch file upload to prevent unforeseen SAP licensing audits. |
| **OP-05** | **Hosting Infrastructure & Tenant Boundary** | Customer operates an independent Azure tenant and on-prem DC, not using the shared ITC data center. | Multi-target architecture: fully portable across Azure (Flexible Server), on-prem (VM/Postgres), and AWS via SQLAlchemy. | Customer Infrastructure / IT Security | Vinod | **Default:** Target Customer's dedicated Azure subscription with VNet Private Endpoints. |
| **OP-06** | **Cross-Border AI Data Residency** | Transmitting invoice images to cloud AI models (Gemini / Azure OpenAI). Does Nepal or corporate compliance permit cross-border processing? | Implemented AI provider region locking (`centralindia` / `southeastasia`) and pre-inference PII masking setting. | Customer Legal & Risk / Compliance | Compliance Officer | **Default:** Use enterprise tenant endpoints where data is processed in-memory and excluded from training. |
| **OP-07** | **Straight-Through Processing Threshold** | Target reference accuracy is 95–98%. What is Customer's accepted cutoff score before routing an invoice to human review? | Implemented configurable `auto_approve_threshold` (default 95.0%) per stream, subcategory, and vendor. | Customer Finance & Accounts Payable | Dipendra | **Default:** Set initial threshold to 95.0%; lower-confidence bills routed to Workbench exception queue. |
| **OP-08** | **Trip ID Absence Operational Policy** | Travel invoices arrive with or without Trip IDs. Should invoices lacking Trip IDs be approved or held? | Absence triggers configurable `WARN` with fallback key resolution (employee + date + route); does not block workflow. | Customer Travel Desk & Finance | Saurabh | **Default:** Allow straight-through processing if total and vendor balance, logging a warning for post-audit review. |

---

## 2. Technical Assumptions Register

1. **Assumption A1 (Bikram Sambat Epoch):** The relationship between Gregorian A.D. and Bikram Sambat B.S. is maintained in `bikram_sambat_calendar`. Leap years and month day variations (29 to 32 days) in the Nepal calendar are resolved exclusively via this table.
2. **Assumption A2 (Vendor Tax Identification):** In Nepal, all legal business entities possess a unique 9-digit PAN. If a vendor invoice carries both a 9-digit PAN and a registered trade name, the PAN is the primary deterministic key for SAP vendor code lookup.
3. **Assumption A3 (Exchange Rates):** Invoices billed in Indian Rupees (INR) are converted to Nepalese Rupees (NPR) using the standard pegged exchange rate (1 INR = 1.60 NPR) unless a daily rate master override is present.
4. **Assumption A4 (Arithmetic Tolerance):** A standard tolerance of 0.05 units is applied during gross reconciliation to accommodate standard rounding variations in 13% VAT and 5% GST fare splits.
