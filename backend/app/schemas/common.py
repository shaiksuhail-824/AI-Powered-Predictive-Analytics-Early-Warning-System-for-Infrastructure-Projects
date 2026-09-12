"""
backend.app.schemas.common - Common pagination models, enums, and meta attributes.
"""

from enum import Enum
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class RiskLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskTrajectoryEnum(str, Enum):
    STABLE = "STABLE"
    DE_ESCALATING = "DE_ESCALATING"
    MODERATE_RISE = "MODERATE_RISE"
    RAPID_ESCALATION = "RAPID_ESCALATION"


class AnomalyStatusEnum(str, Enum):
    NORMAL = "NORMAL"
    UNUSUAL = "UNUSUAL"
    ANOMALOUS = "ANOMALOUS"
    REQUIRES_VERIFICATION = "REQUIRES_VERIFICATION"


class InterventionPriorityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL_INTERVENTION = "CRITICAL_INTERVENTION"


class ProjectStatusEnum(str, Enum):
    ON_TRACK = "On Track"
    WATCH = "Watch"
    DELAYED = "Delayed"
    CRITICAL = "Critical"


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    pagination: PaginationMeta
