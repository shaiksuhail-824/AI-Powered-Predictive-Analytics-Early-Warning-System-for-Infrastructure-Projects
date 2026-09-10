"""
backend.app.core.security - Cryptographic Password Hashing and RFC 7519 HS256 JWT Security Layer.
Zero external bloat: Uses Python standard library hashlib/hmac for robust, production-grade security.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.core.config import settings
from backend.app.schemas.auth import RoleEnum, UserResponse

# HTTP Bearer authentication scheme
security_bearer = HTTPBearer(auto_error=False)


# ==============================================================================
# PASSWORD HASHING & CONSTANT-TIME VERIFICATION (PBKDF2-HMAC-SHA256, 600,000 Rounds)
# ==============================================================================

def hash_password(password: str, iterations: int = 600_000) -> str:
    """
    Hash password using PBKDF2-HMAC-SHA256 with a cryptographically secure 16-byte salt.
    Format: pbkdf2_sha256${iterations}${salt_hex}${hash_hex}
    """
    salt = secrets.token_bytes(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${pw_hash.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against the stored hash in constant time to prevent timing attacks.
    """
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_hash = bytes.fromhex(parts[3])

        computed_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(expected_hash, computed_hash)
    except Exception:
        return False


# ==============================================================================
# RFC 7519 COMPLIANT HS256 JWT ENCODING & DECODING
# ==============================================================================

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(s: str) -> bytes:
    rem = len(s) % 4
    if rem == 2:
        s += "=="
    elif rem == 3:
        s += "="
    elif rem == 1:
        raise ValueError("Invalid base64 length")
    return base64.urlsafe_b64decode(s)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate an RFC 7519 compliant HS256 JSON Web Token.
    """
    payload = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    })

    header = {"alg": "HS256", "typ": "JWT"}

    header_bytes = json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")

    header_b64 = _base64url_encode(header_bytes)
    payload_b64 = _base64url_encode(payload_bytes)

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Verify HS256 signature, validate claims, and decode payload.
    Raises HTTPException(401) on any signature mismatch or expiration.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    header_b64, payload_b64, signature_b64 = parts

    # 1. Verify Signature
    try:
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(settings.JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature",
            headers={"WWW-Authenticate": "Bearer"},
        )


    # 2. Decode Payload
    try:
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Check Expiration
    exp = payload.get("exp")
    if not exp or time.time() > float(exp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


# ==============================================================================
# FASTAPI RBAC DEPENDENCIES
# ==============================================================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> UserResponse:
    """
    FastAPI dependency: Extract and validate JWT Bearer token, return UserResponse.
    Raises HTTP 401 if missing, invalid, or expired.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Missing or invalid Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    username = payload.get("sub")

    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Lazy import to avoid circular dependency
    from backend.app.services.auth_service import auth_service
    user = auth_service.get_user_by_username(username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_roles(*allowed_roles: RoleEnum) -> Callable:
    """
    FastAPI dependency factory: Enforce role-based access control (RBAC).
    Raises HTTP 403 Forbidden if user's role is not in allowed_roles.
    """
    async def role_checker(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access Denied: Role '{current_user.role.value}' does not have permission "
                    f"to access this resource. Requires one of: {[r.value for r in allowed_roles]}"
                ),
            )
        return current_user

    return role_checker
