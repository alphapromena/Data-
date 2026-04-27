# Mizan Scan Engine

Python service that connects to a client's Postgres data source, runs Great Expectations + pandas profiling, computes per-dataset quality metrics and a Data Maturity Index (DMI), and emits a structured JSON document.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in TARGET_PG_DSN
```

## Run

```bash
# Profile every table in the public schema:
python -m mizan_scan run \
  --scan-id 11111111-1111-1111-1111-111111111111 \
  --source-name "Demo Postgres" \
  --schema public

# Or pipe results into a file:
python -m mizan_scan run --scan-id ... > result.json
```

The output JSON conforms to the `ScanEngineOutput` interface in `packages/shared-types`.

## Metrics

| Metric | How it's computed |
|---|---|
| `completeness_pct` | `100 * (1 - null_cells / total_cells)` |
| `null_pct` | `100 * null_cells / total_cells` |
| `duplicate_pct` | `100 * duplicate_rows / row_count` |
| `consistency_score` | mean of per-column dtype-stability + value-range expectation pass rate |
| `accuracy_score` | per-column expectation pass rate (regex, range, set membership) |
| `compliance_flags` | static rules: PII columns, missing PKs, weak FKs |
| `dmi.overall_score` | weighted blend of the five sub-scores → 0–100 |
