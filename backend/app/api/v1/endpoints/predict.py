"""
backend.app.api.v1.endpoints.predict - Real-time scenario prediction endpoint.
"""

from fastapi import APIRouter, Depends
from backend.app.schemas.predict import SingleProjectPredictionRequest, SingleProjectPredictionResponse
from backend.app.services.prediction_service import prediction_service
from backend.app.core.security import require_roles
from backend.app.schemas.auth import RoleEnum, UserResponse

router = APIRouter()


@router.post("/predict/project", response_model=SingleProjectPredictionResponse, summary="Predict Project Risk in Real-Time")
async def predict_project_risk(
    request: SingleProjectPredictionRequest,
    current_user: UserResponse = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.MINISTRY_PROJECT_HEAD)),
) -> SingleProjectPredictionResponse:
    """
    Execute on-the-fly ML inference for scenario simulation.
    Pass project sanction, expenditure, progress, and duration parameters to receive real-time
    delay probability, cost overrun probability, anomaly assessment, and SHAP drivers.
    """
    return prediction_service.predict_project(request)
