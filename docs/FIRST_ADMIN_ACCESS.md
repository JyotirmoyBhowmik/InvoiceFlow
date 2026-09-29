# InvoiceFlow — First Admin Access & Deployment Runbook

This document is the definitive guide for IT operations, security administrators, and DevOps personnel on-boarding a fresh InvoiceFlow deployment. By following these steps, an administrator can attain full verified operational access within **10 minutes**.

---

## 1. Exact Access & Network Matrix

Every microservice, public endpoint, and internal backing store is enumerated below with default port numbers, visibility boundaries, and configuration resolution mechanisms:

| Service Component | Default URL / Socket | Port | Network Boundary | Primary Purpose | Config Location (DB vs `.env`) |
|---|---|---|---|---|---|
| **Admin Panel (Web UI)** | `http://localhost:3000` | `3000` | Public / Corporate LAN | Primary human workbench, rule designer, master data & export console | `.env`: `PORT`, `package.json` (`dev` script) |
| **FastAPI Core API** | `http://localhost:8000` | `8000` | Public / Reverse Proxy | REST API for ingestion, OCR, AI extraction, validation, and export | `.env`: `PORT`, `docker-compose.yml` |
| **OpenAPI / Swagger Docs** | `http://localhost:8000/docs` | `8000` | Public / Corporate LAN | Interactive API testing, schema inspector, and developer reference | FastAPI `docs_url` in `app/main.py` |
| **Liveness Probe** | `http://localhost:8000/healthz` | `8000` | Public / Load Balancer | Kubernetes/Docker health check probe returning HTTP 200 | `app/main.py` |
| **Readiness Probe** | `http://localhost:8000/readyz` | `8000` | Public / Load Balancer | Database connectivity & dependency readiness check | `app/main.py` |
| **Celery Flower Dashboard** | `http://localhost:5555` | `5555` | Internal / VPN Only | Worker concurrency monitor, task event timeline, and rate-limits | `docker-compose.yml` |
| **Prometheus Metrics** | `http://localhost:8000/metrics` | `8000` | Internal / Prometheus Scraper | Ingestion throughput, OCR latency histograms, AI token usage | `app/main.py` / DB setting |
| **PostgreSQL 16 DB** | `postgresql://localhost:5432` | `5432` | Internal / Container Network | Single source of truth, relational metadata, partitioned logs | `.env`: `DATABASE_URL` |
| **Redis Cache & Broker** | `redis://localhost:6379` | `6379` | Internal / Container Network | Celery task message broker and token bucket rate limiter | `.env`: `REDIS_URL` |

---

## 2. Bootstrap Admin Creation (`python -m app.cli create-admin`)

InvoiceFlow employs a strict zero-hardcoded-credentials policy. Initial superadmin users are never written to source code or database migrations. They are provisioned dynamically via the CLI.

### 2.1 Interactive Mode
Run the command and follow the terminal prompts:
```bash
python -m app.cli create-admin
```
Terminal interaction:
```text
======================================================================
INVOICEFLOW ENTERPRISE SUPERADMIN BOOTSTRAP PROVISIONING
======================================================================
Enter admin username: superadmin
Enter admin email address: admin@enterprise.com
Enter secure password (min 12 chars): ************
Confirm password: ************

SUCCESS: Created administrator user 'superadmin' (admin@enterprise.com) assigned role 'SUPER_ADMIN'.
First-login status: must_change_password=TRUE (Enforced in Admin Panel).
======================================================================
```

### 2.2 Non-Interactive Automation Mode (CI/CD / Ansible)
To provision in headless or automated environments without exposing passwords in command histories:
```bash
echo "EnterpriseAdminKey2026!#" | python -m app.cli create-admin \
  --username sysadmin \
  --email sysadmin@enterprise.com \
  --role SUPER_ADMIN \
  --password-stdin \
  --non-interactive
```

### 2.3 Idempotency & Conflict Resolution
The command refuses to overwrite existing accounts accidentally. If the user already exists:
```bash
python -m app.cli create-admin --username sysadmin --email sysadmin@enterprise.com
# Output:
# [IDEMPOTENCY BLOCK] User 'sysadmin' already exists.
# To update credentials for this user, execute with: --reset-password
```
To safely update the credentials of an existing administrator:
```bash
echo "NewEnterprisePass2026!$" | python -m app.cli create-admin \
  --username sysadmin \
  --email sysadmin@enterprise.com \
  --password-stdin \
  --reset-password \
  --non-interactive
```

---

## 3. Complete CLI Command Reference

InvoiceFlow includes 11 enterprise CLI commands in `app/cli.py` for day-to-day operations:

| CLI Command | Syntax | Operational Purpose |
|---|---|---|
| `create-admin` | `python -m app.cli create-admin [--username U] [--email E] [--role R] [--password-stdin]` | Provisions root superadmin user, sets `must_change_password=TRUE`, attaches all permissions |
| `list-users` | `python -m app.cli list-users` | Displays tabular summary of all users, roles, active flags, locked status, failed logins |
| `grant-role` | `python -m app.cli grant-role --user U --role R` | Assigns an RBAC role (`SUPER_ADMIN`, `REVIEWER`, `APPROVER`, `AUDITOR`) |
| `reset-password` | `python -m app.cli reset-password --user U [--password P]` | Resets password, resets failed login counters, marks forced password change on next login |
| `unlock-user` | `python -m app.cli unlock-user --user U` | Clears account lockout flags and resets failed login counters |
| `rotate-secret` | `python -m app.cli rotate-secret` | Generates a fresh AES-256 envelope encryption key and stores it in `system_setting` |
| `check-config` | `python -m app.cli check-config` | Validates environment variables (`DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`) and DB connectivity |
| `test-mailbox` | `python -m app.cli test-mailbox [--profile P]` | Executes a real-time OAuth2 Client Credentials handshake check against Microsoft Graph API |
| `test-ai-provider` | `python -m app.cli test-ai-provider [--provider P]` | Sends a validation probe to Google GenAI SDK / Gemini API and measures latency |
| `test-export-profile` | `python -m app.cli test-export-profile` | Validates column schemas, padding rules, and delimiter compliance for SAP ECC exports |
| `seed-permissions` | `python -m app.cli seed-permissions` | Refreshes and idempotently inserts all system permissions into `invoiceflow.permission` |
| `verify-schema` | `python -m app.cli verify-schema` | Confirms all 20+ tables, constraints, partitioned logs, and views exist in PostgreSQL |

---

## 4. First-Login Flow & Setup Wizard

When logging in for the first time:
1. **Forced Password Change**:
   - Accounts created via `create-admin` have `must_change_password = TRUE`.
   - The user is immediately presented with the Password Change modal requiring a compliant enterprise password (min 12 chars, upper, lower, digit, special character).
2. **MFA Enrolment (Optional)**:
   - If enabled in system settings, the user scans a TOTP QR code and verifies a 6-digit authenticator code.
3. **Landing on Dashboard**:
   - The user lands on the operational dashboard (`http://localhost:3000`).
   - If master data tables are empty, a **Guided Setup Wizard** banner appears:
     - Stage 1: Organization & Company Codes
     - Stage 2: Cost Centers & Departments
     - Stage 3: General Ledger Accounts
     - Stage 4: Expense Categories
     - Stage 5: Tax Codes & Withholding Rates
     - Stage 6: Currency & Base Exchange Rates
     - Stage 7: Vendor Master Records
     - Stage 8: Employee Hierarchy
     - Stage 9: Approval Matrices & Delegation Rules
     - Stage 10: Dynamic Field Definitions
     - Stage 11: OCR Preprocessing Pipeline
     - Stage 12: Exchange Online Mailbox Integration
     - Stage 13: SAP ECC Export Profile Verification

---

## 5. Microsoft Entra ID (Azure AD) SSO Integration

Organizations preferring single sign-on can federate directly with Microsoft Entra ID:

### 5.1 App Registration Steps
1. Navigate to **Azure Portal** -> **Microsoft Entra ID** -> **App registrations** -> **New registration**.
2. **Name**: `InvoiceFlow Enterprise Engine`.
3. **Supported account types**: Accounts in this organizational directory only (Single tenant).
4. **Redirect URI (Web)**: `http://localhost:3000/auth/callback` (or `https://your-domain.com/auth/callback`).
5. Under **Certificates & secrets**, generate a Client Secret.
6. Under **API permissions**, grant:
   - `OpenID permissions`: `openid`, `profile`, `email`
   - `Microsoft Graph`: `User.Read`
7. Under **App roles**, define `InvoiceFlow.SuperAdmin`, `InvoiceFlow.Reviewer`, `InvoiceFlow.Approver`.

### 5.2 Claim Mapping
- `roles` claim mapped to InvoiceFlow internal RBAC:
  - `InvoiceFlow.SuperAdmin` -> `SUPER_ADMIN`
  - `InvoiceFlow.Reviewer` -> `REVIEWER`
  - `InvoiceFlow.Approver` -> `APPROVER`
- `preferred_username` or `email` mapped to `app_user.email`.

### 5.3 Local Break-Glass Account
Always retain at least one local administrator account (`break_glass_root`) configured via `python -m app.cli create-admin --username break_glass_root` to preserve administrative access if identity provider outages occur.

---

## 6. Login & Access Troubleshooting Guide

| Symptom | Probable Root Cause | Resolution Step |
|---|---|---|
| **Blank white page on `http://localhost:3000`** | Frontend dev server failed to start or bound to loopback `127.0.0.1` rather than `0.0.0.0`. | Check terminal for Vite logs. Ensure `package.json` contains `--host 0.0.0.0`. Run `npm run dev`. |
| **502 Bad Gateway / Network Error** | FastAPI backend container (port 8000) crashed during startup or is waiting on Postgres migrations. | Check container logs: `docker logs -f invoiceflow-backend`. Ensure database container is healthy. |
| **CORS policy error in browser console** | API server rejecting request origin from frontend port. | Verify `app.add_middleware(CORSMiddleware, allow_origins=["*"])` in `app/main.py`. |
| **"Invalid credentials" after `create-admin`** | Special characters stripped during shell pipe or keyboard layout mismatch. | Run `python -m app.cli reset-password --user <username>` interactively without piping. |
| **Redirect loop on login page** | Cookie token expired or `sameSite` policy mismatch inside iframe. | Open the application in an incognito window or inspect `session_expires_at` in browser localStorage. |
| **Container healthy but port unreachable** | Port conflict on host machine (another Postgres on 5432 or Redis on 6379). | Change host port mapping in `docker-compose.yml` (e.g. `5433:5432`). |
| **Account locked after 5 attempts** | Brute-force protection counter triggered. | Run `python -m app.cli unlock-user --user <username>`. |
