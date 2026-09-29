# InvoiceFlow Administrator Guide

---

## 1. Daily, Weekly & Monthly Operational Cadence

### Daily Operational Checklist
1. **Review Dashboard Telemetry**:
   - Verify that Straight-Through-Processing (STP) rate meets baseline ($\ge 85\%$).
   - Check the **Pending Review Queue** for aged documents approaching SLA breaches (> 24 hours).
2. **Handle Validation Exceptions**:
   - Access **Review & Correction Workbench**. Review documents held with `VAL-*`, `MSTR-*`, or `TAX-*` flags.
   - Use the **Extraction Evidence View** to inspect original PDF regions before approving.
3. **Execute SAP ECC Export Batches**:
   - Go to **SAP ECC Export Runs**. Review approved documents and trigger standard export runs.
   - Verify that control totals (records, debit balance, SHA-256 checksum) match ERP staging logs.

### Weekly Maintenance Checklist
1. **AI Token Spend & Cost Accounting**:
   - Check **AI Provider & Prompts** to monitor monthly consumption against budget limits.
   - Verify that fallback chains are active and no 429 throttling occurred.
2. **Mailbox Ingestion Status**:
   - Check **Mailbox Profiles** for sync health and ensure delta tokens are advancing without dead-letter accumulation.
3. **Audit Log Inspection**:
   - Review `audit_log` records for any unauthorized changes to field definitions or approval matrices.

### Monthly Maintenance Checklist
1. **Partition Archiving**:
   - Verify that next month's `process_log` partition exists in PostgreSQL.
2. **Vendor Layout Tuning**:
   - Analyze human correction patterns to improve AI field hints.

---

## 2. Managing Exceptions in the Review Workbench

When an invoice fails auto-approval, it enters status `REVIEW_PENDING`.

```
[SCREENSHOT: Dual-Pane Review Workbench with Interactive Bounding Boxes]
```

### Understanding Field Provenance Badges

Every field in the Review Workbench displays a colored provenance badge:
- `EXTRACTED` (Green): Read directly from the document by OCR/AI.
- `DERIVED` (Blue): Computed by business logic (e.g., tax calculation, rounding).
- `MASTER_DEFAULT` (Purple): Defaulted from master data (e.g., employee cost center).
- `USER_CORRECTED` (Amber): Edited by a human operator (audited with user ID and timestamp).
- `NOT_FOUND` (Red): Document did not contain this value. Blocks export if the field is mandatory.

---

## 3. SAP ECC Export Run Reversal & Re-Export

If an exported batch requires financial posting cancellation in SAP:
1. Navigate to **SAP ECC Export Runs**.
2. Select the run to be reversed (e.g., `RUN-2026-0004`).
3. Click the **Reverse Run** button.
4. The system:
   - Marks the run status as `REVERSED`.
   - Reopens batched invoices or links them to a reversal credit memo run.
   - Emits an immutable `RUN_REVERSED` trace in `process_log`.

---

## 4. Backup & Disaster Recovery (DR)

### Backup Procedure (RPO < 1 Hour)
```bash
# Automated database backup with pgcrypto encryption
pg_dump -U postgres -h localhost -F c -b -v -f /backups/invoiceflow_$(date +%Y%m%d_%H%M%S).dump invoiceflow

# Backup document artifact object storage
rsync -avz /var/lib/invoiceflow/artifacts/ /backup_storage/artifacts/
```

### Recovery Procedure (RTO < 30 Minutes)
```bash
# Restore PostgreSQL database
pg_restore -U postgres -h localhost -d invoiceflow -v /backups/invoiceflow_target.dump
```
