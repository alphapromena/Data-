"""Quality profiler — computes dataset metrics using GE expectations + pandas.

Outputs a DatasetProfile per table.
"""

from __future__ import annotations

import re
from typing import Any

import great_expectations as gx
import pandas as pd

from mizan_scan.output.schema import DatasetProfile

PII_HINTS = re.compile(r"(email|phone|mobile|nationalid|iqama|passport|ssn|iban)", re.IGNORECASE)


def _pct(numerator: float, denominator: float) -> float:
    return round(100.0 * numerator / denominator, 2) if denominator else 0.0


def _column_dtype_consistency(series: pd.Series) -> float:
    """Fraction of values that match the dominant inferred type."""
    if series.empty:
        return 100.0
    types = series.dropna().map(lambda v: type(v).__name__)
    if types.empty:
        return 100.0
    dominant = types.value_counts(normalize=True).iloc[0]
    return round(100.0 * float(dominant), 2)


def _ge_pass_rate(df: pd.DataFrame) -> float:
    """Run a small set of GE expectations and return pass rate (0–100)."""
    if df.empty:
        return 100.0
    context = gx.get_context(mode="ephemeral")
    asset = context.data_sources.add_pandas("ephemeral").add_dataframe_asset("ds")
    batch_def = asset.add_batch_definition_whole_dataframe("batch")
    batch = batch_def.get_batch(batch_parameters={"dataframe": df})

    results: list[bool] = []
    for col in df.columns:
        results.append(batch.validate(gx.expectations.ExpectColumnToExist(column=col)).success)
        if pd.api.types.is_numeric_dtype(df[col]):
            non_null = df[col].dropna()
            if not non_null.empty:
                results.append(
                    batch.validate(
                        gx.expectations.ExpectColumnValuesToBeBetween(
                            column=col,
                            min_value=float(non_null.min()),
                            max_value=float(non_null.max()),
                        )
                    ).success
                )
    if not results:
        return 100.0
    return round(100.0 * sum(1 for r in results if r) / len(results), 2)


def _compliance_flags(df: pd.DataFrame, has_primary_key: bool) -> list[str]:
    flags: list[str] = []
    if not has_primary_key:
        flags.append("missing_primary_key")
    pii_cols = [c for c in df.columns if PII_HINTS.search(c)]
    if pii_cols:
        flags.append(f"pii_columns:{','.join(pii_cols)}")
    return flags


def profile_dataframe(
    dataset_name: str,
    df: pd.DataFrame,
    *,
    full_row_count: int | None = None,
    has_primary_key: bool = False,
) -> DatasetProfile:
    row_count = full_row_count if full_row_count is not None else len(df)
    column_count = df.shape[1]
    total_cells = max(len(df) * column_count, 1)

    null_cells = int(df.isna().sum().sum())
    null_pct = _pct(null_cells, total_cells)
    completeness_pct = round(100.0 - null_pct, 2)

    duplicate_rows = int(df.duplicated().sum())
    duplicate_pct = _pct(duplicate_rows, len(df) or 1)

    column_profile: dict[str, Any] = {}
    consistencies: list[float] = []
    for col in df.columns:
        c = _column_dtype_consistency(df[col])
        consistencies.append(c)
        column_profile[col] = {
            "dtype": str(df[col].dtype),
            "null_pct": _pct(int(df[col].isna().sum()), len(df) or 1),
            "unique_count": int(df[col].nunique(dropna=True)),
            "dtype_consistency": c,
        }

    consistency_score = round(sum(consistencies) / len(consistencies), 2) if consistencies else 100.0
    accuracy_score = _ge_pass_rate(df)

    return DatasetProfile(
        dataset_name=dataset_name,
        row_count=row_count,
        column_count=column_count,
        completeness_pct=completeness_pct,
        duplicate_pct=duplicate_pct,
        null_pct=null_pct,
        consistency_score=consistency_score,
        accuracy_score=accuracy_score,
        compliance_flags=_compliance_flags(df, has_primary_key=has_primary_key),
        column_profile=column_profile,
    )
