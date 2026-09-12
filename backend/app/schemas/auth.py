"""
backend.app.schemas.auth - Authentication and Authorization Schemas.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    MINISTRY_PROJECT_HEAD = "MINISTRY_PROJECT_HEAD"
    AGENCY_CONTRACTOR = "AGENCY_CONTRACTOR"


class LoginRequest(BaseModel):
    username: str = Field(..., description="Official government / contractor username")
    password: str = Field(..., description="Account authentication password")


class UserResponse(BaseModel):
    username: str
    name: str
    email: str
    role: RoleEnum
    organization: Optional[str] = None
    scoped_agency: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
