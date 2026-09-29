# InvoiceFlow — Database Schema & Data Dictionary

**Target Database**: PostgreSQL 16+  
**Schema Namespace**: `invoiceflow`  
**Master Script**: `schema/00_master.sql`  

---

## 1. Schema Overview

The database is structured into 6 logical domain clusters:
1. **Access Control & Identity**: `app_user`, `role`, `permission`, `user_role`, `role_permission`
2. **Metadata & Schemas**: `field_definition`, `rule`, `error_catalog`, `system_setting`
3. **Master Data**: `company_code`, `cost_center`, `gl_account`, `vendor`, `expense_category`, `tax_code`, `currency`
4. **Core Processing**: `document`, `document_artifact`, `extracted_field`, `invoice_line_item`, `validation_exception`
5. **Export Subsystem**: `export_profile`, `export_column`, `export_run`
6. **Telemetry & Audit**: `process_log` (Monthly Range Partitioned)

---

## 2. Table-by-Table Data Dictionary

### Table: `invoiceflow.document`
Primary record for an ingested invoice document.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key |
| `document_number` | `VARCHAR(100)` | Yes | Extracted invoice number (e.g. `INV-2026-9042`) |
| `document_status` | `VARCHAR(30)` | No | `INGESTED`, `PREPROCESSED`, `OCR_COMPLETE`, `EXTRACTED`, `VALIDATED`, `REVIEW_PENDING`, `APPROVED`, `EXPORTED`, `REJECTED` |
| `received_at` | `TIMESTAMPTZ` | No | Timestamp when document entered system |
| `source_type` | `VARCHAR(30)` | No | `MAILBOX`, `UPLOAD`, `SFTP`, `API` |
| `stp_score` | `NUMERIC(5,2)` | Yes | Mean confidence score across extracted mandatory fields (0.00–100.00) |
| `is_stp_approved` | `BOOLEAN` | No | True if document passed straight-through approval threshold |
| `total_amount` | `NUMERIC(18,2)` | Yes | Gross financial amount |
| `tax_amount` | `NUMERIC(18,2)` | Yes | Extracted tax amount |
| `currency_code` | `VARCHAR(3)` | Yes | ISO currency code (e.g. `USD`, `EUR`, `NPR`) |
| `document_date` | `DATE` | Yes | Invoiced date issued by vendor |
| `vendor_id` | `UUID` | Yes | Foreign Key to `invoiceflow.vendor(id)` |
| `company_code_id` | `UUID` | Yes | Foreign Key to `invoiceflow.company_code(id)` |
| `artifact_id` | `UUID` | No | Foreign Key to immutable `invoiceflow.document_artifact(id)` |
| `created_at` | `TIMESTAMPTZ` | No | System row insertion time |

### Table: `invoiceflow.document_artifact`
Immutable storage record for binary invoice payload.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key |
| `sha256_hash` | `CHAR(64)` | No | Unique SHA-256 cryptographic digest |
| `original_filename` | `VARCHAR(255)` | No | Original filename received |
| `file_size_bytes` | `BIGINT` | No | Exact byte count |
| `mime_type` | `VARCHAR(100)` | No | `application/pdf`, `image/png`, `image/tiff`, etc. |
| `storage_uri` | `VARCHAR(1000)` | No | Filesystem or cloud object storage reference |

### Table: `invoiceflow.extracted_field`
Stores individual field extractions with spatial coordinates and provenance tracking.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key |
| `document_id` | `UUID` | No | Foreign Key to `invoiceflow.document(id)` |
| `field_key` | `VARCHAR(100)` | No | Reference to `field_definition.field_key` |
| `raw_value` | `TEXT` | Yes | Exact text extracted from document text |
| `normalized_value` | `TEXT` | Yes | Parsed/formatted representation (e.g. ISO date) |
| `confidence` | `NUMERIC(5,2)` | No | Extraction confidence percentage (0.00–100.00) |
| `value_source` | `VARCHAR(30)` | No | `EXTRACTED`, `USER_CORRECTED`, `DERIVED`, `MASTER_DEFAULT`, `NOT_FOUND` |
| `source_bounding_box` | `JSONB` | Yes | Spatial coordinates `{x, y, w, h}` on document |
| `is_edited` | `BOOLEAN` | No | Indicates manual human correction in workbench |
