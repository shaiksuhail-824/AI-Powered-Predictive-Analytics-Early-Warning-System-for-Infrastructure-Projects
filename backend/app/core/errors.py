"""
backend.app.core.errors - Standardized Error Handling & Exception Types.
Ensures clean, structured JSON error responses without exposing internal stack traces.
"""

from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: str
    message: str
    detail: Optional[Any] = None
    status_code: int


class ProjectNotFoundError(Exception):
    def __init__(self, project_code: str):
        self.project_code = project_code
        super().__init__(f"Project with code '{project_code}' not found.")


class StateNotFoundError(Exception):
    def __init__(self, state_name: str):
        self.state_name = state_name
        super().__init__(f"State or Union Territory '{state_name}' not found.")


class ModelInferenceError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


async def project_not_found_handler(request: Request, exc: ProjectNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "PROJECT_NOT_FOUND",
            "message": f"No project found matching project_code '{exc.project_code}'.",
            "detail": {"project_code": exc.project_code},
            "status_code": status.HTTP_404_NOT_FOUND,
        },
    )


async def state_not_found_handler(request: Request, exc: StateNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "STATE_NOT_FOUND",
            "message": f"No infrastructure records found for State/UT '{exc.state_name}'.",
            "detail": {"state_name": exc.state_name},
            "status_code": status.HTTP_404_NOT_FOUND,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected server error occurred while processing the request.",
            "detail": str(exc) if not isinstance(exc, AssertionError) else "Validation assertion failure",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )
