"""
Helpers for features frozen for the MVP (docs/SPEC.md §1.2).

Frozen endpoints stay in the codebase but answer with a clear "Not in MVP" response
instead of serving demo data.
"""

from fastapi import HTTPException

NOT_IN_MVP_DETAIL = "Not in MVP: this feature is under development and is not available yet."


def not_in_mvp() -> HTTPException:
    return HTTPException(status_code=503, detail=NOT_IN_MVP_DETAIL)
