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

---

## 5. Master Data Updates by Email Procedure (Part D.4)

Finance administrators can update master tables without direct SQL access:

1. **Emailing the File:**
   - Attach the SAP CSV export of the master (e.g. `VENDORS_EXPORT_20260930.csv`).
   - Send from an authorized corporate domain (e.g. `@snpl.com.np`, `@enterprise.internal`) to `masters@snpl.com.np`.
   - Subject line must include the master type keyword (e.g. `[MASTER UPDATE: VENDOR]`).
2. **Automated Safety & Diff Calculation:**
   - The engine validates header columns and computes rows added, updated, or deactivated.
   - **Safety Threshold:** If deactivations exceed 10.0%, the import status is held in `PENDING_APPROVAL`.
3. **Approving or Rolling Back:**
   - In the Admin Console under **Master Data Management > Import Batches**, review the diff summary.
   - Click **Approve & Apply** to commit changes, or **Rollback** to immediately restore the prior snapshot.
   - Alternatively via CLI:
     ```bash
     python -m app.cli master-import --type VENDOR --file /path/to/vendors.csv --apply
     ```

---

## 6. Accuracy Evaluation Harness Operation (Part G)

To empirically test sample invoice batches against ground truth:

1. **Register an Evaluation Sample Set:**
   ```bash
   python -m app.cli eval create-set --name CUSTOMER_SAMPLES_V1 --folder /data/customer_samples/
   ```
2. **Ground Truth Entry:**
   - Access **Evaluation Harness > Ground Truth Editor** in the Admin Console.
   - Enter verified invoice values once (stored separately from production data; never exported to SAP).
3. **Execute Benchmark in Sandbox Mode:**
   ```bash
   python -m app.cli eval run --set CUSTOMER_SAMPLES_V1 --model-profile gemini-3.1-flash-lite
   ```
4. **Inspect Generated Report:**
   - Automatically outputs detailed Markdown report and Excel workbook.
   - Evaluates exact-match %, tolerance-match %, straight-through processing (STP) rate, tokens consumed, and effective cost per invoice against the 15 paisa benchmark.

