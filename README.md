# InvoiceFlow — Enterprise Invoice Ingestion, OCR & SAP ECC Export System

InvoiceFlow is a production-grade, multi-tenant-capable, metadata-driven invoice processing platform built for SAP ECC (FI/CO, MM) enterprise integrations.

---

## 1. Quick Start: First Admin Access within 10 Minutes

### 1.1 Service Access Matrix

| Service | URL / Port | Visibility | Purpose |
|---|---|---|---|
| **Admin Panel (Web UI)** | `http://localhost:3000` | Public / Corporate LAN | Primary workbench, rules, master data & export console |
| **FastAPI Core API** | `http://localhost:8000` | Public / Reverse Proxy | REST API for ingestion, OCR, AI extraction, validation |
| **OpenAPI / Swagger Docs** | `http://localhost:8000/docs` | Public / Corporate LAN | Interactive API documentation and schema explorer |
| **Liveness & Readiness Probes** | `http://localhost:8000/healthz`, `/readyz` | Public | Kubernetes/Docker health checks |
| **Celery Flower Dashboard** | `http://localhost:5555` | Internal / VPN | Background worker concurrency and queue monitor |
| **PostgreSQL 16 Database** | `postgresql://localhost:5432` | Internal | Relational schema, master data, partitioned process logs |
| **Redis Cache & Broker** | `redis://localhost:6379` | Internal | Celery broker and rate limiter |

### 1.2 Bootstrap Admin User Creation

InvoiceFlow enforces zero hardcoded credentials. To create the root superadministrator:

```bash
# Interactive mode:
python -m app.cli create-admin

# Non-interactive / CI automation:
echo "EnterpriseAdminKey2026!#" | python -m app.cli create-admin \
  --username admin \
  --email admin@enterprise.com \
  --password-stdin \
  --non-interactive
```

*Note: For instant local testing without terminal access, click **First Admin Access -> Break-Glass Superadmin** in the Web UI header.*

---

## 2. P0 Architectural Fix: Strict Document-First Provenance

### The Rule: The Document is the Single Source of Truth
- An invoice record is **never** created manually or generated out of thin air.
- Invoices are created **exclusively** from authentic binary file bytes (PDF, TIFF, PNG, JPEG, ZIP) arriving via monitored mailboxes or uploaded through the **Upload Source Document** gate.
- Every invoice record is permanently bound to its cryptographic `document_artifact_sha256` hash.
- **Zero Fabrication**: Any field not present in the physical document is marked `NOT_FOUND` with 0% confidence and raises a `VAL-001` validation exception. It is never filled with synthetic defaults or placeholder figures.

---

## 3. Resolving "Manual Run Does Not Work"

If triggering a run produces no processed documents or appears to fail silently:
1. **Pipeline Scan vs. SAP Batch Export**:
   - In **Run Manager** (`SAP Runs`), click **Trigger Pipeline Scan** to poll the monitored mailbox and watch folders. If 0 new files are in the mailbox, the system reports this clearly in the diagnostic banner.
   - To ingest files immediately, use **Upload Source Document** in the top navigation bar. You can upload any PDF or click **Load: Apex Industrial (#INV-2026-9042)** to test with a real in-memory test artifact.
2. **SAP ECC Batch Export Gate**:
   - The **Generate SAP Batch** button requires invoices in `APPROVED` status.
   - If invoices are in `REVIEW_PENDING`, the Run Manager displays an amber notice explaining that human verification in the **Review Workbench** is required before financial files can be compiled.

---

## 4. Complete CLI Command Reference (`app/cli.py`)

| Command | Usage | Description |
|---|---|---|
| `create-admin` | `python -m app.cli create-admin` | Creates root administrator, sets `must_change_password=TRUE` |
| `list-users` | `python -m app.cli list-users` | Lists all users, roles, active flags, and lock status |
| `grant-role` | `python -m app.cli grant-role --user U --role R` | Grants an RBAC role to a user |
| `reset-password` | `python -m app.cli reset-password --user U` | Resets user password and clears failed attempt counters |
| `unlock-user` | `python -m app.cli unlock-user --user U` | Unlocks an account locked due to excessive failed attempts |
| `rotate-secret` | `python -m app.cli rotate-secret` | Generates and updates AES-256 envelope encryption key |
| `check-config` | `python -m app.cli check-config` | Verifies environment variables and database connectivity |
| `test-mailbox` | `python -m app.cli test-mailbox` | Tests Microsoft Graph API token acquisition and inbox access |
| `test-ai-provider` | `python -m app.cli test-ai-provider` | Tests Gemini / GenAI SDK structured extraction response |
| `test-export-profile` | `python -m app.cli test-export-profile` | Validates SAP ECC export profile columns and padding rules |
| `seed-permissions` | `python -m app.cli seed-permissions` | Seeds or updates system permission catalog |
| `verify-schema` | `python -m app.cli verify-schema` | Verifies all required tables and indexes exist in PostgreSQL |

---

## 5. Enterprise Documentation Suite (`/docs`)

Comprehensive documentation is provided in the `/docs` directory:

1. [`docs/FIRST_ADMIN_ACCESS.md`](docs/FIRST_ADMIN_ACCESS.md) — 10-Minute Access Guide, Access Matrix & Troubleshooting
2. [`docs/P0_DEFECT_ANALYSIS_AND_FIX.md`](docs/P0_DEFECT_ANALYSIS_AND_FIX.md) — Strict Document-First Architecture & Provenance Guarantees
3. [`docs/HONEST_GAP_REPORT.md`](docs/HONEST_GAP_REPORT.md) — Production Readiness Audit & External Dependencies
4. [`docs/01_Installation_Guide.md`](docs/01_Installation_Guide.md) — Bare-Metal, Docker & Database Setup
5. [`docs/02_Configuration_Guide.md`](docs/02_Configuration_Guide.md) — Metadata Fields, Rules & Tax Engine
6. [`docs/03_Administrator_Guide.md`](docs/03_Administrator_Guide.md) — User Management, Audit Logs & Queue Health
7. [`docs/04_Implementation_Guide.md`](docs/04_Implementation_Guide.md) — Enterprise Rollout & Entra ID PowerShell
8. [`docs/05_User_Guide.md`](docs/05_User_Guide.md) — Review Workbench, Evidence Inspector & Approvals
9. [`docs/06_Operations_Runbook.md`](docs/06_Operations_Runbook.md) — Incident Playbooks & Log Partitions
10. [`docs/07_API_Reference.md`](docs/07_API_Reference.md) — REST API Endpoints & cURL Examples
11. [`docs/08_Data_Dictionary.md`](docs/08_Data_Dictionary.md) — Table-by-Table Column Definitions & Constraints
12. [`docs/09_Security_and_Compliance.md`](docs/09_Security_and_Compliance.md) — AES-256 Encryption, RBAC Matrix & GDPR
13. [`docs/10_Test_Plan_and_UAT.md`](docs/10_Test_Plan_and_UAT.md) — 15-Scenario End-to-End UAT Script
14. [`docs/11_Architecture_Document.md`](docs/11_Architecture_Document.md) — C4 Container Diagrams & State Machine
15. [`docs/12_FAQ_and_Troubleshooting.md`](docs/12_FAQ_and_Troubleshooting.md) — Common Operational Questions & Answers

---

## 6. License
Enterprise Proprietary — InvoiceFlow Financial Automation Suite.
