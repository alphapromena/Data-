"""Postgres connector — discovers tables and pulls samples into pandas."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


@dataclass
class TableRef:
    schema: str
    name: str

    @property
    def fqn(self) -> str:
        return f'"{self.schema}"."{self.name}"'

    @property
    def label(self) -> str:
        return f"{self.schema}.{self.name}"


class PostgresConnector:
    """Lightweight wrapper around a SQLAlchemy engine for profiling."""

    def __init__(self, dsn: str) -> None:
        self._engine: Engine = create_engine(dsn, pool_pre_ping=True)

    def list_tables(self, schemas: list[str]) -> list[TableRef]:
        sql = text(
            """
            select table_schema, table_name
            from information_schema.tables
            where table_type = 'BASE TABLE'
              and table_schema = any(:schemas)
            order by table_schema, table_name
            """
        )
        with self._engine.connect() as conn:
            rows = conn.execute(sql, {"schemas": schemas}).fetchall()
        return [TableRef(schema=r[0], name=r[1]) for r in rows]

    def row_count(self, table: TableRef) -> int:
        with self._engine.connect() as conn:
            return int(conn.execute(text(f"select count(*) from {table.fqn}")).scalar() or 0)

    def sample(self, table: TableRef, limit: int) -> pd.DataFrame:
        # TABLESAMPLE would be better on huge tables; ORDER BY random() is fine for a scaffold.
        sql = f"select * from {table.fqn} order by random() limit {int(limit)}"
        with self._engine.connect() as conn:
            return pd.read_sql(sql, conn)

    def close(self) -> None:
        self._engine.dispose()
