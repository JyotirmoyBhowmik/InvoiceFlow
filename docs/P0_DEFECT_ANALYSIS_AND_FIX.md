# P0 Critical Defect Analysis & Architectural Fix

**Document Reference**: `P0-DEFECT-001`  
**Classification**: High-Severity Architectural & Data Integrity Defect  
**Status**: Resolved & Enforced  

---

## 1. Defect Description & Observed Failure Mode

In early prototype iterations, the application exhibited an inversion of the enterprise document processing paradigm:
- The UI allowed an operator to manually type invoice headers (vendor name, invoice number, amounts, taxes, cost centers) from scratch without attaching an authentic source document.
- In instances where an OCR or AI model returned an incomplete extraction, default values or synthetic placeholders were populated into financial fields.
- This transformed InvoiceFlow into a **manual invoice-entry form or document generator**, violating the foundational rule:
  > *"Rule 1: No Mock Data. Master Data Must Be Configurable. The document is the single source of truth."*

---

## 2. Root Cause Analysis (RCA)

1. **Lack of Ingestion Gate Verification**: The API and UI allowed invoice creation records without verifying the presence of an immutable binary artifact payload (`document_artifact`).
2. **Fallback Permissiveness**: When AI confidence was low or an invoice field was absent from the document, client-side fallback logic erroneously defaulted fields to empty or sample values rather than stamping them as `NOT_FOUND` with 0% confidence and raising a `BLOCK` severity exception.
3. **Missing Artifact Provenance Constraint**: Database constraints did not mandate a valid foreign key to `document_artifact` before writing to `document` and `extracted_field`.

---

## 3. The Correct Design & Architectural Guarantees

Under the remediated architecture, the following non-negotiable invariants are enforced:

### Invariant 1: The Document is the Single Source of Truth
An invoice record can **never** be generated out of thin air. An invoice record exists **if and only if** a real physical file arrives via:
- Exchange Online monitored mailbox attachment or inline image.
- Manual file upload in the Admin Panel (`.pdf`, `.tiff`, `.png`, `.jpeg`, `.zip`).
- Watched SFTP directory scanner.

### Invariant 2: Cryptographic Artifact Linkage
Every document record is permanently bound to its binary artifact:
- `document_artifact_sha256`: Hex-encoded SHA-256 hash computed over the raw file bytes before parsing.
- `document_artifact_id`: Immutable storage reference identifier.
- `document_artifact_uri`: Filesystem or cloud object storage path.
- `original_filename` & `file_size_bytes` & `mime_type`.

### Invariant 3: Zero Fabrication / Strict `NOT_FOUND` Semantics
If the OCR and AI layers cannot find a value in the document:
- The raw value is stored as `""` (empty string).
- The normalized value is stored as `""`.
- The confidence score is stamped as `0%`.
- The `value_source` is set strictly to `NOT_FOUND`.
- If the field is marked `is_mandatory` in `field_definition`, the validation engine immediately raises an error: `VAL-001: Mandatory field not found in source document` with severity `BLOCK`.
- The document is routed to `REVIEW_PENDING`. Under no circumstances is it auto-approved or filled with placeholder data.

### Invariant 4: Human Workbench as Auditor, Not Typist
The Review & Correction Workbench is designed strictly for:
1. **Verification**: Comparing extracted field values and spatial bounding boxes against the rendered original document on the left pane.
2. **Remediation**: Correcting OCR recognition errors (e.g. `O` vs `0`, tax code re-classification).
3. **Approval**: Releasing the validated payload to the SAP ECC export gate.

---

## 4. Verification & Audit Trail

Every field extraction carries full provenance metadata:
```json
{
  "field_key": "total_cost",
  "raw_value": "9350.00",
  "normalized_value": "9350.00",
  "confidence": 98.4,
  "value_source": "EXTRACTED",
  "extractor_name": "gemini-2.5-flash",
  "source_page": 1,
  "source_bounding_box": { "x": 65, "y": 85, "w": 30, "h": 4 }
}
```
If a human reviewer changes a value:
```json
{
  "field_key": "total_cost",
  "normalized_value": "9350.00",
  "value_source": "USER_CORRECTED",
  "is_edited": true,
  "last_edited_by": "superadmin",
  "edited_at": "2026-09-29T10:15:22Z"
}
```
All corrections generate an immutable entry in the partitioned `process_log` table.
