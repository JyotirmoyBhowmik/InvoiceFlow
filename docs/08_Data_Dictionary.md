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

---

## 3. Prompt 03 Reference Solution Tables

### Table: `invoiceflow.processing_stream`
Defines configurable business processing streams (Stream A: Travel Payment vs Stream B: Tax Credit).

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key |
| `stream_code` | `VARCHAR(50)` | No | Unique identifier (`STREAM_A_ITH_TRAVEL`, `STREAM_B_AIRLINE_TAX_CREDIT`) |
| `stream_name` | `VARCHAR(150)` | No | Descriptive title |
| `purpose` | `VARCHAR(50)` | No | `VENDOR_PAYMENT`, `TAX_CREDIT_CLAIM`, `GENERAL` |
| `export_profile_key` | `VARCHAR(100)` | No | Linked SAP ECC export profile |
| `scheduler_cron` | `VARCHAR(50)` | No | Cron schedule (e.g. `0 * * * *` for hourly :00 execution) |
| `auto_approve_threshold`| `NUMERIC(5,2)` | No | Minimum confidence cutoff for straight-through approval (default 95.00) |
| `detection_rules` | `JSONB` | No | Mailbox, sender, subject, and AI keyword detection criteria |

### Table: `invoiceflow.processing_stream_subcategory`
Defines sub-categories (Hotel, Air, Train, Cab) with specialized mandatory field matrices.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key |
| `stream_code` | `VARCHAR(50)` | No | Foreign Key to `processing_stream(stream_code)` |
| `subcategory_code`| `VARCHAR(50)` | No | `HOTEL`, `AIRLINE`, `TRAIN`, `CAB`, `GENERAL` |
| `mandatory_field_keys`| `JSONB` | No | Array of mandatory field keys required before auto-approval |
| `default_expense_gl` | `VARCHAR(50)` | Yes | Default SAP GL account for category |

### Table: `invoiceflow.tax_regime`
Regime-driven tax master supporting Nepal VAT, Indian GST, and global VAT.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `regime_code` | `VARCHAR(50)` | No | Unique key (`NEPAL_VAT`, `INDIA_GST`) |
| `tax_type` | `VARCHAR(30)` | No | `VAT`, `GST` |
| `identifier_name`| `VARCHAR(50)` | No | `PAN` (Nepal 9-digit), `GSTIN` (India 15-char) |
| `identifier_regex`| `VARCHAR(255)` | No | Verification regular expression |
| `standard_tax_rate`| `NUMERIC(5,2)`| No | Default tax percentage (13.00 for Nepal VAT) |
| `input_tax_claimable`| `BOOLEAN` | No | Flags if input-tax credit is legally claimable |

### Table: `invoiceflow.bikram_sambat_calendar`
Maintainable database conversion table for Bikram Sambat (B.S.) to Gregorian (A.D.) dates.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `ad_date` | `DATE` | No | Gregorian date (Unique Key) |
| `bs_year` | `INT` | No | Bikram Sambat year (e.g. 2083) |
| `bs_month` | `INT` | No | Month (1 = Baisakh, 6 = Ashwin, etc.) |
| `bs_day` | `INT` | No | Day of month |
| `bs_date_str` | `VARCHAR(20)` | No | Formatted B.S. date (e.g. `2083-06-08`) |
| `nepal_fiscal_year`| `VARCHAR(20)` | No | Nepal Fiscal Year (e.g. `2083/84`) |
| `nepal_fiscal_period`| `INT` | No | Accounting period 1 (Shrawan) to 12 (Ashadh) |

### Table: `invoiceflow.master_import_batch`
Tracks automated master data view file updates by email or upload.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `batch_number` | `VARCHAR(60)` | No | Unique batch reference |
| `profile_key` | `VARCHAR(60)` | No | Reference to `master_import_profile` |
| `total_rows` | `INT` | No | Total rows ingested |
| `rows_added` | `INT` | No | Added records |
| `rows_updated` | `INT` | No | Updated records |
| `rows_deactivated`| `INT` | No | Deactivated records |
| `safety_threshold_breached`| `BOOLEAN`| No | True if deactivation exceeds threshold (10.0%) |
| `status` | `VARCHAR(30)` | No | `RECEIVED`, `DIFF_CALCULATED`, `PENDING_APPROVAL`, `APPLIED`, `ROLLED_BACK` |

### Table: `invoiceflow.evaluation_run`
Logs sandbox evaluation harness accuracy results against ground truth.

| Column | Data Type | Nullable | Description |
|---|---|---|---|
| `run_code` | `VARCHAR(60)` | No | Unique evaluation run code |
| `model_profile` | `VARCHAR(100)` | No | AI model tested (`gemini-3.1-flash-lite`, etc.) |
| `overall_exact_match_pct`| `NUMERIC(5,2)`| No | Exact character match percentage |
| `overall_tolerance_match_pct`| `NUMERIC(5,2)`| No | Tolerance match (delta <= 0.05) percentage |
| `stp_rate_pct` | `NUMERIC(5,2)`| No | Straight-through processing rate |
| `nepali_language_accuracy_pct`| `NUMERIC(5,2)`| No | Devanagari & Nepali accuracy percentage |
| `avg_cost_inr` | `NUMERIC(10,4)`| No | Average AI cost per invoice in INR |

