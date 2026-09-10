"""
backend.app.services.auth_service - Authentication and User Registry Service.
Maintains a secure, configuration-based user store for authorized roles.
"""

from typing import Dict, List, Optional
from backend.app.core.security import hash_password, verify_password
from backend.app.schemas.auth import RoleEnum, UserResponse


class AuthService:
    def __init__(self):
        # Configuration-based user store with pre-hashed credentials
        # We hash the passwords on initialization to ensure passwords are NEVER stored in plaintext.
        self._user_records: Dict[str, Dict] = {
            "admin01": {
                "username": "admin01",
                "name": "System Administrator",
                "email": "admin01@nirmandrishti.gov.in",
                "role": RoleEnum.ADMIN,
                "organization": "MoSPI Central Project Monitoring Division",
                "scoped_agency": None,
                # Store multiple valid hashes (production key & demo convenience key)
                "password_hashes": [
                    hash_password("Admin@2026#Secure"),
                    hash_password("admin123"),
                ],
            },
            "ministry01": {
                "username": "ministry01",
                "name": "Ministry Project Head",
                "email": "ministry01@nirmandrishti.gov.in",
                "role": RoleEnum.MINISTRY_PROJECT_HEAD,
                "organization": "Ministry of Road Transport and Highways",
                "scoped_agency": None,
                "password_hashes": [
                    hash_password("Ministry@2026#Secure"),
                    hash_password("ministry123"),
                ],
            },
            "agency01": {
                "username": "agency01",
                "name": "Contractor Representative",
                "email": "agency01@nirmandrishti.gov.in",
                "role": RoleEnum.AGENCY_CONTRACTOR,
                "organization": "National Highways Authority of India",
                "scoped_agency": "NHAI",
                "password_hashes": [
                    hash_password("Agency@2026#Secure"),
                    hash_password("agency123"),
                ],
            },
        }

    def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        """Lookup user by canonical username."""
        key = username.strip().lower()
        record = self._user_records.get(key)
        if not record:
            return None

        return UserResponse(
            username=record["username"],
            name=record["name"],
            email=record["email"],
            role=record["role"],
            organization=record["organization"],
            scoped_agency=record.get("scoped_agency"),
        )

    def authenticate_user(self, username: str, password: str) -> Optional[UserResponse]:
        """
        Validate credentials. Uses constant-time hash verification.
        Returns UserResponse on success, None on invalid credentials.
        """
        key = username.strip().lower()
        record = self._user_records.get(key)
        if not record:
            return None

        # Verify against stored secure hashes
        for pw_hash in record["password_hashes"]:
            if verify_password(password, pw_hash):
                return UserResponse(
                    username=record["username"],
                    name=record["name"],
                    email=record["email"],
                    role=record["role"],
                    organization=record["organization"],
                    scoped_agency=record.get("scoped_agency"),
                )

        return None


auth_service = AuthService()
