"""
backend.app.api.v1.endpoints.auth - Authentication Endpoints.
Provides POST /login (token issuance) and GET /me (current user identity).
"""

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.config import settings
from backend.app.core.security import create_access_token, get_current_user
from backend.app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from backend.app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login & JWT Issuance",
    description="Validates username and password against secure cryptographic credentials, returning an HS256 JWT access token."
)
async def login(credentials: LoginRequest) -> TokenResponse:
    """Validate credentials and issue an RFC 7519 compliant JWT."""
    user = auth_service.authenticate_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue JWT token with embedded role and identity claims
    token_payload = {
        "sub": user.username,
        "role": user.role.value,
        "name": user.name,
        "email": user.email,
        "organization": user.organization,
        "scoped_agency": user.scoped_agency,
    }
    access_token = create_access_token(token_payload)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Authenticated User Profile",
    description="Validates the Authorization Bearer JWT token and returns the current user profile."
)
async def get_me(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    return current_user
