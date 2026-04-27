"""Pydantic models for scan engine output.

These models mirror the TypeScript types in @mizan/shared-types and define
the JSON contract between the Python scan engine and the Node.js API.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DatasetProfile(BaseModel):
    """Per-table/dataset profiling results."""
    dataset_name: str
    row_count: int
    column_count: int
    completeness_pct: float    # 0–100: % of non-null cells
    duplicate_pct: float       # 0–100: % of duplicate rows
    null_pct: float            # 0–100: % of null cells
    consistency_score: float   # 0–100: dtype consistency across columns
    accuracy_score: float      # 0–100: Great Expectations pass rate
    compliance_flags: list[str] = Field(default_factory=list)
    column_profile: dict[str, Any] = Field(default_factory=dict)


class DMI(BaseModel):
    """Data Maturity Index — weighted roll-up of all dataset profiles."""
    overall_score: float       # 0–100 composite score
    completeness_score: float
    consistency_score: float
    accuracy_score: float
    duplication_score: float   # 100 - avg(duplicate_pct)
    compliance_score: float
    grade: str                 # A / B / C / D / E


class DataSourceRef(BaseModel):
    """Reference to the profiled data source."""
    kind: str   # postgres | mysql | excel | csv | …
    name: str   # human-readable label


class ScanEngineOutput(BaseModel):
    """Root output model — written to stdout as JSON by the scan engine CLI."""
    scan_id: str
    client_id: str | None = None   # passed through from the API trigger
    data_source: DataSourceRef
    datasets: list[DatasetProfile]
    dmi: DMI
    generated_at: datetime
