#!/usr/bin/env bash
# ==============================================================================
# MoSPI PAIMANA Early-Warning & Predictive Analytics Platform (SIH26103)
# Rollback Script: Reverts ECS Services to Previous Task Definition Revision
# ==============================================================================

set -Eeuo pipefail

echo "===================================================================="
echo " MoSPI PAIMANA ECS Service Rollback Protocol"
echo "===================================================================="

AWS_REGION="${AWS_REGION:-ap-south-1}"
PROJECT_NAME="${PROJECT_NAME:-paimana}"
ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-${PROJECT_NAME}-cluster}"
ECS_FRONTEND_SERVICE="${ECS_FRONTEND_SERVICE:-${PROJECT_NAME}-frontend-service}"
ECS_BACKEND_SERVICE="${ECS_BACKEND_SERVICE:-${PROJECT_NAME}-backend-service}"

rollback_service() {
    local SERVICE_NAME="$1"
    local FAMILY_NAME="$2"

    echo "[+] Rolling back service: ${SERVICE_NAME}..."
    TASK_ARNS="$(aws ecs list-task-definitions --region "$AWS_REGION" --family-prefix "$FAMILY_NAME" --sort DESC --query "taskDefinitionArns" --output json)"
    COUNT=$(echo "$TASK_ARNS" | jq 'length')

    if [ "$COUNT" -lt 2 ]; then
        echo "[-] No previous task definition found for family ${FAMILY_NAME} (only ${COUNT} revision available)."
        return 0
    fi

    CURRENT_TASK="$(echo "$TASK_ARNS" | jq -r '.[0]')"
    PREVIOUS_TASK="$(echo "$TASK_ARNS" | jq -r '.[1]')"

    echo "    - Current task definition:  ${CURRENT_TASK}"
    echo "    - Target rollback revision: ${PREVIOUS_TASK}"

    aws ecs update-service --region "$AWS_REGION" \
        --cluster "${ECS_CLUSTER_NAME}" \
        --service "${SERVICE_NAME}" \
        --task-definition "${PREVIOUS_TASK}" \
        --force-new-deployment >/dev/null

    echo "    - Rollback deployment initiated for ${SERVICE_NAME}."
}

rollback_service "${ECS_BACKEND_SERVICE}" "${PROJECT_NAME}-backend"
rollback_service "${ECS_FRONTEND_SERVICE}" "${PROJECT_NAME}-frontend"

echo "[+] Awaiting service stability after rollback..."
aws ecs wait services-stable --region "$AWS_REGION" \
    --cluster "${ECS_CLUSTER_NAME}" \
    --services "${ECS_BACKEND_SERVICE}" "${ECS_FRONTEND_SERVICE}"

echo "===================================================================="
echo " Rollback Complete: Services restored to previous stable revisions."
echo "===================================================================="
