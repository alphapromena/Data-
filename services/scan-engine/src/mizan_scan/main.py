"""CLI entrypoint: connects to Postgres, profiles tables, prints JSON to stdout.

Usage:
    python -m mizan_scan --scan-id <UUID> --dsn <postgres://...> [--client-id <UUID>]
                         [--source-name "SAP HR"] [--schema public] [--tables t1 t2]
                         [--sample-size 100000]

Output: ScanEngineOutput JSON to stdout (parsed by the Node.js API).
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from typing import Annotated

import typer
from dotenv import load_dotenv

from mizan_scan.connectors.postgres import PostgresConnector, TableRef
from mizan_scan.output.schema import DataSourceRef, ScanEngineOutput
from mizan_scan.profilers.quality import profile_dataframe
from mizan_scan.scoring.dmi import compute_dmi

load_dotenv()

app = typer.Typer(help="Mizan Scan Engine — data quality profiler.", no_args_is_help=True)


def _table_has_pk(connector: PostgresConnector, table: TableRef) -> bool:
    from sqlalchemy import text

    sql = text(
        """
        select 1
        from information_schema.table_constraints
        where table_schema = :schema
          and table_name   = :name
          and constraint_type = 'PRIMARY KEY'
        limit 1
        """
    )
    with connector._engine.connect() as conn:  # noqa: SLF001
        return bool(conn.execute(sql, {"schema": table.schema, "name": table.name}).first())


@app.command()
def run(
    scan_id: Annotated[str, typer.Option(help="Scan UUID from the mizan scans table.")],
    dsn: Annotated[str, typer.Option(envvar="TARGET_PG_DSN", help="Target Postgres DSN.")],
    client_id: Annotated[str, typer.Option(help="Client UUID (written into DMI output).")] = "",
    source_name: Annotated[str, typer.Option(help="Display name of the data source.")] = "Postgres source",
    schema: Annotated[list[str], typer.Option(help="Schemas to profile.")] = ["public"],
    tables: Annotated[list[str], typer.Option(help="Specific tables to profile (default: all).")] = [],
    sample_size: Annotated[int, typer.Option(envvar="SAMPLE_SIZE", help="Max rows to sample per table.")] = 100_000,
) -> None:
    """Profile every table in the given schema(s) and emit JSON to stdout.

    The JSON is consumed by the Mizan API (Node.js) which persists results
    to scan_results and dmi_scores tables in Railway PostgreSQL.
    """
    if not dsn:
        typer.echo("error: TARGET_PG_DSN is required (env or --dsn).", err=True)
        raise typer.Exit(code=2)

    connector = PostgresConnector(dsn)
    try:
        all_tables = connector.list_tables(schema)

        # Filter to specific tables if requested
        if tables:
            table_set = set(tables)
            all_tables = [t for t in all_tables if t.name in table_set or t.label in table_set]

        if not all_tables:
            typer.echo("warning: no tables found to profile.", err=True)

        datasets = []
        for t in all_tables:
            typer.echo(f"  profiling {t.label} ...", err=True)
            row_count = connector.row_count(t)
            df = connector.sample(t, limit=min(sample_size, max(row_count, 1)))
            try:
                has_pk = _table_has_pk(connector, t)
            except Exception:
                has_pk = False
            datasets.append(
                profile_dataframe(t.label, df, full_row_count=row_count, has_primary_key=has_pk)
            )

        dmi = compute_dmi(datasets)

        output = ScanEngineOutput(
            scan_id=scan_id,
            client_id=client_id or None,
            data_source=DataSourceRef(kind="postgres", name=source_name),
            datasets=datasets,
            dmi=dmi,
            generated_at=datetime.now(timezone.utc),
        )
        sys.stdout.write(output.model_dump_json(indent=2))
        sys.stdout.write("\n")

    except Exception as exc:
        typer.echo(f"fatal: {exc}", err=True)
        raise typer.Exit(code=1) from exc
    finally:
        connector.close()


if __name__ == "__main__":
    app()
