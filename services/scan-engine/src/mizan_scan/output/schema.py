"""Pydantic models for scan engine output. Mirrors @mizan/shared-types ScanEngineOutput."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DatasetProfile(BaseModel):
    dataset_name: str
    row_count: int
    column_count: int
    completeness_pct: float
    duplicate_pct: float
    null_pct: float
    consistency_score: float
    accuracy_score: float
    compliance_flags: list[str] = Field(default_factory=list)
    column_profile: dict[str, Any] = Field(default_factory=dict)


class DMI(BaseModel):
    overall_score: float
    completeness_score: float
    consistency_score: float
    accuracy_score: float
    duplication_score: float
    compliance_score: float
    grade: str


class DataSourceRef(BaseModel):
    kind: str
    name: str


class ScanEngineOutput(BaseModel):
    scan_id: str
    data_source: DataSourceRef
    datasets: list[DatasetProfile]
    dmi: DMI
    generated_at: datetime
