# InvoiceFlow — Implementation & Rollout Guide

**Target Audience**: Enterprise Project Managers, SAP Functional Consultants (FI/CO), Solution Architects  

---

## 1. Enterprise Rollout Methodology

InvoiceFlow is implemented using a 4-phase rollout methodology designed to ensure data integrity and zero business disruption to financial close cycles:

```
[Phase 1: Discovery & Master Data] ──> [Phase 2: Pilot Dual-Run] ──> [Phase 3: Assisted Automation] ──> [Phase 4: Full Straight-Through Processing]
```

### Phase 1: Discovery & Master Data Alignment (Weeks 1–2)
- Map SAP ECC 6.0 / S/4HANA Chart of Accounts, Company Codes, Cost Centers, and Payment Terms.
- Export active vendor master records (`LIFNR`, `NAME1`, `STCD1`) from SAP transaction `SE16N` (`LFA1` / `LFB1`) and import into InvoiceFlow.
- Establish Exchange Online AP shared mailboxes (`invoices-ap@company.com`) and configure Microsoft Entra ID Application Access Policies.

### Phase 2: Pilot Dual-Run (Weeks 3–4)
- Connect mailboxes in **read-only / shadow mode**.
- All invoices are ingested, OCR-processed, and AI-extracted.
- Accounts Payable personnel review 100% of documents in the Review Workbench.
- Export files are generated in CSV format and validated manually in SAP via transaction `FB60` (Park Document) without financial posting.

### Phase 3: Assisted Automation (Weeks 5–6)
- Enable the Straight-Through Processing (STP) auto-approval gate with a conservative threshold (98.0% mean field confidence).
- High-confidence recurring utility bills and PO-matched invoices post automatically.
- Complex and non-PO invoices route to AP reviewers.

### Phase 4: Full Production Optimization (Week 7+)
- Tune OCR preprocessing filters (deskew angle, bilateral filter strength).
- Calibrate custom JSONB validation rules and tax determination matrices.
- Achieve target 80%+ STP rate.

---

## 2. Microsoft Entra ID Application Access Policy Setup

To comply with the principle of least privilege, do not grant application-wide access to every mailbox in the corporate tenant. Restrict access strictly to the AP mailbox using Exchange Online PowerShell:

```powershell
# 1. Connect to Exchange Online
Connect-ExchangeOnline -UserPrincipalName securityadmin@company.com

# 2. Create Mail-Enabled Security Group for Authorized AP Mailboxes
New-DistributionGroup -Name "InvoiceFlow-AuthorizedMailboxes" -Type "Security"

# 3. Add Accounts Payable Mailbox
Add-DistributionGroupMember -Identity "InvoiceFlow-AuthorizedMailboxes" -Member "invoices-ap@company.com"

# 4. Enforce Scoped Application Access Policy
New-ApplicationAccessPolicy `
  -AppId "4481-app-registration-id" `
  -PolicyScopeGroupId "InvoiceFlow-AuthorizedMailboxes@company.com" `
  -AccessRight RestrictAccess `
  -Description "Restrict InvoiceFlow to AP Shared Mailbox only"

# 5. Test Access Policy Enforcement
Test-ApplicationAccessPolicy `
  -Identity "invoices-ap@company.com" `
  -AppId "4481-app-registration-id"
# Output should return: AccessCheckResult: Granted
```

---

## 3. SAP ECC Integration Architecture

InvoiceFlow interfaces with SAP ECC using the **Batch Direct Input / Standard Flat File Ingestion Interface**:
- Standard CSV files compliant with SAP FB60 standard layout.
- Fixed-width files with strict zero-padding (`PAD_ZERO`) for numerical accounts (e.g. `0000100000`).
- Generated batches contain a SHA-256 control checksum and control total calculation verifying `SUM(debits) - SUM(credits) = 0`.
