"""Data Maturity Index — rolls per-dataset profiles up into one 0–100 score."""

from __future__ import annotations

from mizan_scan.output.schema import DMI, DatasetProfile

# Weights sum to 1.0. Tune these with the AlphaPro methodology team.
WEIGHTS: dict[str, float] = {
    "completeness": 0.25,
    "consistency": 0.20,
    "accuracy": 0.20,
    "duplication": 0.15,
    "compliance": 0.20,
}


def _avg(values: list[float]) -> float:
    return round(sum(values) / len(values), 2) if values else 0.0


def _grade(score: float) -> str:
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "E"


def compute_dmi(datasets: list[DatasetProfile]) -> DMI:
    if not datasets:
        return DMI(
            overall_score=0.0,
            completeness_score=0.0,
            consistency_score=0.0,
            accuracy_score=0.0,
            duplication_score=0.0,
            compliance_score=0.0,
            grade="E",
        )

    completeness = _avg([d.completeness_pct for d in datasets])
    consistency = _avg([d.consistency_score for d in datasets])
    accuracy = _avg([d.accuracy_score for d in datasets])
    duplication = round(100.0 - _avg([d.duplicate_pct for d in datasets]), 2)

    flagged = sum(1 for d in datasets if d.compliance_flags)
    compliance = round(100.0 * (1.0 - flagged / len(datasets)), 2)

    overall = round(
        WEIGHTS["completeness"] * completeness
        + WEIGHTS["consistency"] * consistency
        + WEIGHTS["accuracy"] * accuracy
        + WEIGHTS["duplication"] * duplication
        + WEIGHTS["compliance"] * compliance,
        2,
    )

    return DMI(
        overall_score=overall,
        completeness_score=completeness,
        consistency_score=consistency,
        accuracy_score=accuracy,
        duplication_score=duplication,
        compliance_score=compliance,
        grade=_grade(overall),
    )
