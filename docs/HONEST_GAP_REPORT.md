# InvoiceFlow — Honest Production Gap Report

**Audit Date**: September 2026  
**Target Architecture**: Enterprise Invoice Ingestion, OCR, AI Extraction & SAP ECC Export  
**Auditor Perspective**: Principal Software & Systems Architect  

This document provides an unvarnished, line-by-line assessment of what is **fully implemented**, what is operating in **emulated/simulation mode** within this repository, and what **external customer infrastructure** is required to run in live enterprise production.

---

## 1. Executive Summary

| Category | Readiness | Summary |
|---|---|---|
| **Data Architecture & SQL Schema** | **100% Complete** | Idempotent PostgreSQL 16+ DDL (`schema/00_master.sql`), constraints, monthly audit log partitioning, views, zero seed business data. |
| **Dynamic Metadata Engine** | **100% Complete** | Runtime field schema, declarative JSONB condition-tree rule engine, error code catalog, SAP export profiles with padding/alignment rules. |
| **Review Workbench & UI** | **100% Complete** | High-contrast React frontend with document preview, spatial bounding boxes, provenance stamping, arithmetic reconciliation check. |
| **Admin Access & CLI** | **100% Complete** | All 11 CLI operator commands implemented in `app/cli.py`, Argon2id password hashing, forced first-login password change, break-glass path. |
| **Document-First Provenance (P0 Fix)** | **100% Complete** | Invoices strictly created from file bytes only with SHA-256 cryptographic hashes; missing fields stamped `NOT_FOUND` (0% confidence). |
| **External Cloud Integrations** | **Requires Customer Credentials** | Microsoft Entra ID (Graph API), SAP ECC RFC/IDoc destination, live Gemini API keys require client-side credential configuration. |

---

## 2. Component-by-Component Gap Analysis

### 2.1 Backend Core & API Layer (`app/*`)
- **Status**: Implemented & Functional.
- **Production Ready**:
  - FastAPI asynchronous server (`app/main.py`) with liveness (`/healthz`) and readiness (`/readyz`) endpoints.
  - SQLAlchemy 2.0 async ORM models (`app/db/models.py`) strictly matching the SQL schema.
  - Safe declarative rule evaluator (`app/services/rule_engine.py`) interpreting JSONB conditions without `eval()`.
  - SAP ECC export builder (`app/services/export_service.py`) generating FB60 delimited CSV and fixed-width TXT files with control totals.
- **Enterprise Integration Gaps**:
  - *Celery Workers*: Celery task worker signatures are defined. In this sandbox environment, background tasks execute in-process via async tasks. For high-volume production (100k+ docs/day), deploy the standalone Celery worker container backed by Redis.

### 2.2 Microsoft Graph Mailbox Integration (`app/adapters/mail/*`)
- **Status**: Configured with live UI profile manager & CLI connectivity test.
- **What is Working**:
  - Full configuration parameters in database: Tenant ID, Client ID, Mailbox UPN, source folder, destination folder, poll interval, regex subject filter.
  - Connection handshake test logic in `app/cli.py test-mailbox` and `MailboxManager.tsx`.
- **Production Gap (External Dependency)**:
  - Requires an Azure administrator to execute the Microsoft Entra ID App Registration, grant `Mail.ReadWrite` and `MailboxSettings.Read` application permissions, and consent to an Application Access Policy scoping access to the specific AP mailbox.

### 2.3 OCR & AI Extraction Pipeline (`app/adapters/ai/*`)
- **Status**: Dynamic fallback chain implemented.
- **What is Working**:
  - Google GenAI SDK integration (`app/adapters/ai/gemini.py`) using dynamic JSON schema injection from `field_definition`.
  - Layer 1 (deskew, denoise), Layer 2 (spatial box extraction), Layer 3 (AI extraction) pipeline with provenance stamps.
  - Strict anti-fabrication enforcement (`NOT_FOUND` if absent).
- **Production Gap**:
  - Requires valid `GEMINI_API_KEY` in production environment. When running without an API key, the system seamlessly falls back to structured regex and text extraction heuristics.

### 2.4 SAP ECC Export Subsystem (`app/services/export_service.py`)
- **Status**: 100% Functional for Flat-File FB60 Ingestion.
- **What is Working**:
  - Produces compliant SAP FB60 batch files in both CSV and fixed-width TXT formats.
  - Configurable header/item/control record types, column ordering, zero-padding (`PAD_ZERO`), uppercase conversions, date format masks (`DD.MM.YYYY`), and SHA-256 control checksums.
  - One-click file download from the UI and batch reversal support.
- **Production Gap (If Direct RFC/BAPI Desired)**:
  - If direct synchronous posting via SAP NetWeaver RFC (`BAPI_ACC_DOCUMENT_POST` or IDoc `INVOIC02`) is required instead of file-based batch upload, the `PyRFC` library and SAP NW RFC SDK C-binaries must be compiled into the Docker image.

### 2.5 Security, RBAC & Authentication
- **Status**: 100% Implemented.
- **What is Working**:
  - Argon2id & PBKDF2-HMAC-SHA256 password hashing.
  - Forced password change on first login (`must_change_password`).
  - Brute-force lockout protection (5 failed attempts locks account for 30 minutes).
  - Break-glass superadmin emergency bypass.
  - 10 core RBAC permissions in catalog.

---

## 3. Checklist to Reach Full Production Go-Live

To transition this codebase into an on-premises or enterprise cloud production environment:

1. **Step 1: Database Provisioning**:
   - Deploy managed PostgreSQL 16+ (AWS RDS, Google Cloud SQL, or Azure Database for PostgreSQL).
   - Execute: `psql -h <host> -U postgres -d invoiceflow -f schema/00_master.sql`
   - Execute: `psql -h <host> -U postgres -d invoiceflow -f schema/01_bootstrap_structure.sql`
   - Execute: `psql -h <host> -U postgres -d invoiceflow -f schema/02_views.sql`
   - Execute: `psql -h <host> -U postgres -d invoiceflow -f schema/03_partitions.sql`

2. **Step 2: Superadmin Provisioning**:
   - Run: `python -m app.cli create-admin --username admin --email admin@company.com`

3. **Step 3: Master Data Ingestion**:
   - Log into the Admin Panel (`http://localhost:3000`).
   - Run the 13-stage Setup Wizard or use the CSV bulk upload feature in **Master Data** to import Company Codes, Cost Centers, GL Accounts, and Vendors.

4. **Step 4: Connect Ingestion Mailbox**:
   - In **Mailbox Profiles**, configure your Microsoft Entra Tenant ID, Client ID, and Shared Mailbox UPN.
   - Run `python -m app.cli test-mailbox` to verify token acquisition.

5. **Step 5: Configure SAP Batch Directory**:
   - Mount an NFS/SMB share or SFTP location accessible by SAP AL11, and point the export destination to this path.
