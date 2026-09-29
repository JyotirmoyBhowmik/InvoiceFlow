# InvoiceFlow — REST API Reference & Developer Guide

**API Version**: `1.0.0`  
**OpenAPI Specification**: Available live at `http://localhost:8000/docs` or `http://localhost:8000/openapi.json`  

---

## 1. Authentication

All requests to the `/api/v1/*` endpoints require a Bearer token or API key header:
```http
Authorization: Bearer <JWT_OR_API_TOKEN>
```

---

## 2. Ingestion Endpoints

### `POST /api/v1/documents/upload`
Uploads a physical invoice file (PDF, TIFF, PNG, JPEG, ZIP) to the ingestion pipeline.

**Request**:
`multipart/form-data`
- `file`: Binary file payload
- `source_channel`: Optional string identifier (e.g. `MANUAL_PORTAL`)

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@/path/to/invoice_INV-2026-9042.pdf"
```

**Response (HTTP 201 Created)**:
```json
{
  "document_id": "doc_1727599200000",
  "document_number": "INV-2026-9042",
  "document_status": "REVIEW_PENDING",
  "artifact_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "stp_score": 96.5,
  "is_stp_approved": false,
  "total_amount": 9350.00,
  "currency_code": "USD",
  "validation_errors": []
}
```

---

## 3. Review & Approval Endpoints

### `POST /api/v1/documents/{document_id}/approve`
Approves an invoice for SAP ECC financial export.

**Request**:
```json
{
  "notes": "Verified against purchase order PO-88910"
}
```

**Response (HTTP 200 OK)**:
```json
{
  "document_id": "doc_1727599200000",
  "document_status": "APPROVED",
  "approved_by": "superadmin",
  "approved_at": "2026-09-29T10:30:00Z"
}
```

---

## 4. Export Batch Execution

### `POST /api/v1/exports/execute`
Compiles all `APPROVED` invoices into a SAP ECC export batch file.

**Request**:
```json
{
  "profile_key": "SAP_ECC_FB60_STANDARD"
}
```

**Response (HTTP 201 Created)**:
```json
{
  "run_id": "run_1727599400000",
  "run_number": "RUN-2026-0001",
  "total_documents": 14,
  "total_debit": 48210.50,
  "checksum_sha256": "SHA256-9f82d1c0a2b4e871",
  "status": "GENERATED",
  "download_urls": {
    "csv": "/api/v1/exports/runs/run_1727599400000/download/csv",
    "txt": "/api/v1/exports/runs/run_1727599400000/download/txt"
  }
}
```
