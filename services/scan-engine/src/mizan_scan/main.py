"""CLI entrypoint: connects to Postgres, profiles tables, prints JSON to stdout."""

from __future__ import annotations

import json
import os
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
    with connector._engine.connect() as conn:  # noqa: SLF001 — internal helper
        return bool(conn.execute(sql, {"schema": table.schema, "name": table.name}).first())


@app.command()
def run(
    scan_id: Annotated[str, typer.Option(help="Scan UUID from Supabase scans table.")],
    source_name: Annotated[str, typer.Option(help="Display name of the data source.")] = "Postgres source",
    schema: Annotated[list[str], typer.Option(help="Schemas to profile.")] = ["public"],
    dsn: Annotated[str, typer.Option(envvar="TARGET_PG_DSN", help="Postgres DSN.")] = "",
    sample_size: Annotated[int, typer.Option(envvar="SAMPLE_SIZE")] = 100_000,
) -> None:
    """Profile every table in the given schema(s) and emit JSON to stdout."""
    if not dsn:
        typer.echo("error: TARGET_PG_DSN is required (env or --dsn).", err=True)
        raise typer.Exit(code=2)

    connector = PostgresConnector(dsn)
    try:
        tables = connector.list_tables(schema)
        datasets = []
        for t in tables:
            row_count = connector.row_count(t)
            df = connector.sample(t, limit=min(sample_size, row_count or sample_size))
            try:
                has_pk = _table_has_pk(connector, t)
            except Exception:
                has_pk = False
            datasets.append(
                profile_dataframe(t.label, df, full_row_count=row_count, has_primary_key=has_pk)
            )

        output = ScanEngineOutput(
            scan_id=scan_id,
            data_source=DataSourceRef(kind="postgres", name=source_name),
            datasets=datasets,
            dmi=compute_dmi(datasets),
            generated_at=datetime.now(timezone.utc),
        )
        sys.stdout.write(output.model_dump_json(indent=2))
        sys.stdout.write("\n")
    finally:
        connector.close()


if __name__ == "__main__":
    app()
