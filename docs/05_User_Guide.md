# InvoiceFlow — Accounts Payable User & Reviewer Guide

**Target Audience**: Accounts Payable Clerks, Reviewers, Accounting Supervisors  

---

## 1. Daily Workflow Overview

As an Accounts Payable Reviewer, your primary responsibility is **verifying extracted invoice data against the original document** and releasing validated invoices to the SAP ECC export gate.

```
[New Invoice Ingested] ──> [Appears in Review Workbench] ──> [Verify Evidence] ──> [Approve / Correct] ──> [SAP ECC Export]
```

---

## 2. Review & Correction Workbench Layout

The Workbench is divided into two synchronized panes:

### 2.1 Left Pane: Original Document Evidence Inspector
- Displays the authentic scanned PDF or image document.
- **Zoom & Navigation**: Use `+` and `-` controls to magnify low-resolution receipts.
- **Spatial Bounding Box Overlay**: Clicking on any field on the right pane automatically draws a colored bounding box around the source text on the document.
- **Artifact Metadata**: Displays the cryptographic SHA-256 hash, original filename, byte size, and receipt timestamp.

### 2.2 Right Pane: Extracted Fields & Validation Exceptions
- **Provenance Badges**:
  - `EXTRACTED`: Value extracted directly from document text by OCR/AI.
  - `USER_CORRECTED`: Value manually verified or edited by a reviewer.
  - `DERIVED`: Computed via tax or arithmetic formulas.
  - `MASTER_DEFAULT`: Sourced from configured organization master defaults.
  - `NOT_FOUND`: Field was missing from the source document.
- **Confidence Scores**: Color-coded indicator (Green: >= 90%, Yellow: 70–89%, Red: < 70%).
- **Validation Exceptions**: Displays actionable error messages (e.g. `VAL-002: Arithmetic mismatch`, `MSTR-001: Vendor not in Master Data`).

---

## 3. Keyboard Shortcuts & Operational Procedures

| Action | Keystroke / Control | Operational Description |
|---|---|---|
| **Approve Document** | `Alt + A` or "Approve Invoice" Button | Releases document to `APPROVED` status for SAP batch export. |
| **Reject to Vendor** | `Alt + R` or "Reject Invoice" Button | Opens rejection modal requiring a business reason; notifies sender. |
| **Edit Field** | Click on field value | Opens inline edit mode. Field is stamped `USER_CORRECTED` with reviewer timestamp. |
| **Inspect Evidence** | Click field badge | Centers and highlights the corresponding bounding box on the original document. |
| **Next Document** | `Alt + Right Arrow` | Advances to the next invoice in the review queue. |

---

## 4. Arithmetic Reconciliation Check

Every document undergoes real-time arithmetic balancing:
$$\text{Gross Total} = \sum(\text{Line Net Amounts}) + \text{Tax Amount}$$
If the discrepancy exceeds the configured tolerance ($\pm \$0.05$), the header turns amber with a warning: `VAL-002: Header total does not match line items + taxes`. You must reconcile line amounts before approval.
