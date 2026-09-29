# InvoiceFlow — Security, Privacy & Compliance Architecture

**Target Audience**: Chief Information Security Officer (CISO), Data Privacy Officers, SOC 2 / ISO 27001 Auditors  

---

## 1. Cryptographic Controls & Key Management

- **Data in Transit**: All client-to-API and service-to-service communication is encrypted using TLS 1.3 with forward secrecy cipher suites.
- **Data at Rest**:
  - Application secrets (mailbox passwords, OAuth client secrets, API tokens) are envelope-encrypted using AES-256-GCM.
  - The master key is stored in the environment (`SECRET_ENCRYPTION_KEY`) and can be rotated using `python -m app.cli rotate-secret`.
- **Integrity Verification**:
  - Every invoice file is hashed with SHA-256 upon arrival. Any byte-level corruption or unauthorized modification invalidates the digest and stops pipeline processing.

---

## 2. Authentication & Session Security

- **Password Hashing**: Argon2id (memory-hard, resistant to GPU/ASIC cracking) with fallback to PBKDF2-HMAC-SHA256 (120,000 iterations).
- **Password Policy**:
  - Minimum 12 characters
  - At least one uppercase letter, one lowercase letter, one digit, and one special character
  - Passwords are never logged, echoed, or included in query strings.
- **Account Lockout Policy**:
  - 5 consecutive failed login attempts locks the account for 30 minutes.
  - Unlocking can be performed by an administrator via `python -m app.cli unlock-user --user <username>`.
- **Session Tokens**: JWT signed using HMAC-SHA256 or RS256 with an 8-hour maximum time-to-live (TTL).

---

## 3. Role-Based Access Control (RBAC) Matrix

| Permission Key | Super Admin | Reviewer | Approver | Auditor |
|---|:---:|:---:|:---:|:---:|
| `INVOICE_VIEW` | Yes | Yes | Yes | Yes |
| `INVOICE_EDIT` | Yes | Yes | No | No |
| `INVOICE_APPROVE` | Yes | No | Yes | No |
| `INVOICE_REJECT` | Yes | Yes | Yes | No |
| `EXPORT_EXECUTE` | Yes | No | Yes | No |
| `EXPORT_REVERSE` | Yes | No | No | No |
| `CONFIG_FIELDS` | Yes | No | No | No |
| `CONFIG_RULES` | Yes | No | No | No |
| `CONFIG_MASTER_DATA` | Yes | No | No | No |
| `CONFIG_SYSTEM` | Yes | No | No | No |

---

## 4. GDPR & PII Data Protection

- **Purpose Limitation**: Personal data contained in invoices (e.g. contractor names, tax IDs, banking IBANs) is processed solely for accounts payable reconciliation and tax compliance.
- **Audit Immutability**: All modifications to extracted fields write an immutable audit event to `process_log` detailing who changed the field, what the old and new values were, and the exact UTC timestamp.
