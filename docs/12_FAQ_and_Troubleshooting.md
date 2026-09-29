# InvoiceFlow — Frequently Asked Questions (FAQ) & Operational Troubleshooting

---

## 1. First Access & Deployment FAQ

### Q1: Where do I find the initial administrator credentials?
**A**: InvoiceFlow follows a zero-hardcoded-credentials policy. Run `python -m app.cli create-admin` to provision your initial superadministrator, or click **First Admin Access -> Break-Glass Superadmin** in the Web UI for instant emergency testing.

### Q2: What ports need to be open in firewall security groups?
**A**:
- Port `3000`: Admin Panel Web UI (Corporate LAN / Public via ingress)
- Port `8000`: FastAPI Core API (Reverse Proxy / Load Balancer)
- Port `5432`: PostgreSQL (Internal subnet only)
- Port `6379`: Redis (Internal subnet only)
- Port `5555`: Celery Flower (VPN / Internal DevOps only)

### Q3: Why does `create-admin` fail with a password policy error?
**A**: Passwords must contain a minimum of 12 characters, including at least one uppercase letter, one lowercase letter, one digit, and one special symbol. Use the `--force` flag to bypass policy checks during local evaluation.

---

## 2. Ingestion & Extraction Troubleshooting

### Q4: Why is an invoice stuck in `REVIEW_PENDING`?
**A**: A document routes to `REVIEW_PENDING` if:
1. Mean field confidence is below the Straight-Through Processing threshold (default: 95%).
2. A mandatory field could not be located in the file (`NOT_FOUND`).
3. An arithmetic mismatch exists between line items, taxes, and header totals (`VAL-002`).
4. The extracted vendor is not registered in ERP Master Data (`MSTR-001`).

### Q5: Can I manually type in an invoice without uploading a file?
**A**: **No.** In accordance with strict enterprise auditability standards and data provenance controls, every invoice record must be backed by an immutable physical document artifact (`document_artifact_sha256`).

### Q6: How do I test extraction if I don't have an invoice PDF handy?
**A**: In the **Upload Source Document** modal, click **Load: Apex Industrial (#INV-2026-9042)** or **Load: Swift Logistics (#BILL-7721)**. The system will generate an authentic binary PDF artifact in memory and execute the full extraction pipeline.

---

## 3. SAP ECC Export FAQ

### Q7: Why does clicking "Generate SAP Batch" show a warning?
**A**: SAP ECC export batches can only be generated for invoices in `APPROVED` status. If invoices are pending review in the Workbench, approve them first before creating the financial batch.

### Q8: What format does the export engine produce?
**A**: Standard SAP ECC FB60 layout in both comma-delimited CSV and fixed-width TXT with zero-padded accounts (e.g. `0000100000`) and a SHA-256 batch control total.
