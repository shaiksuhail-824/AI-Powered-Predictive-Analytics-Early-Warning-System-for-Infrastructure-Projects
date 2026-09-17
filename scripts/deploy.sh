#!/usr/bin/env bash
# ==============================================================================
# MoSPI PAIMANA Early-Warning & Predictive Analytics Platform (SIH26103)
# Phase 2: Normal Application Deployment (Docker Image Build, Push & ECS Update)
# ==============================================================================
# This script deploys application updates to ALREADY EXISTING AWS infrastructure:
#   1. Validates required pre-existing infrastructure (ECR, ECS cluster, services, ALB)
#   2. Authenticates to Amazon ECR
#   3. Builds & tags backend and frontend images with the Git commit SHA
#   4. Pushes images to Amazon ECR
#   5. Registers updated task definitions with immutable commit SHA tags
#   6. Updates existing ECS services
#   7. Awaits service stability and verifies target health
#   8. Executes post-deployment HTTP health checks
#
# NOTE:
#   - Does NOT create VPC, ALB, Cluster, Security Groups, or Target Groups.
#   - If any required cloud resource is missing, exits with a clear error.
# ==============================================================================

set -Eeuo pipefail
trap 'echo "[-] Deployment aborted on line $LINENO" >&2' ERR

echo "===================================================================="
echo " MoSPI PAIMANA Phase 2: Application Deployment"
echo "===================================================================="

# ------------------------------------------------------------------------------
# 1. Validate Prerequisite Tools
# ------------------------------------------------------------------------------
command -v aws >/dev/null 2>&1 || { echo "[-] Fatal: AWS CLI is not installed." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "[-] Fatal: Docker is not installed." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "[-] Fatal: jq is not installed." >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "[-] Fatal: curl is not installed." >&2; exit 1; }

# Parse arguments
DRY_RUN=false
IMAGE_TAG_ARG=""

for arg in "$@"; do
    case "$arg" in
        --dry-run|-n)
            DRY_RUN=true
            ;;
        *)
            if [ -z "$IMAGE_TAG_ARG" ]; then
                IMAGE_TAG_ARG="$arg"
            fi
            ;;
    esac
done

# ------------------------------------------------------------------------------
# 2. Resolve Environment & Target Identifiers
# ------------------------------------------------------------------------------
AWS_REGION="${AWS_REGION:-ap-south-1}"
PROJECT_NAME="${PROJECT_NAME:-paimana}"

CALLER_IDENTITY="$(aws sts get-caller-identity --output json)"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(echo "$CALLER_IDENTITY" | jq -r '.Account')}"
CALLER_ARN="$(echo "$CALLER_IDENTITY" | jq -r '.Arn')"

# Immutable image tag (Commit SHA preferred)
GIT_COMMIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
IMAGE_TAG="${IMAGE_TAG_ARG:-${IMAGE_TAG:-${GIT_COMMIT_SHA}}}"

# Infrastructure Target Names
ECR_FRONTEND_REPO="${ECR_FRONTEND_REPO:-${PROJECT_NAME}-frontend}"
ECR_BACKEND_REPO="${ECR_BACKEND_REPO:-${PROJECT_NAME}-backend}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FRONTEND_IMAGE_URI="${ECR_REGISTRY}/${ECR_FRONTEND_REPO}:${IMAGE_TAG}"
BACKEND_IMAGE_URI="${ECR_REGISTRY}/${ECR_BACKEND_REPO}:${IMAGE_TAG}"

ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-${PROJECT_NAME}-cluster}"
ECS_FRONTEND_SERVICE="${ECS_FRONTEND_SERVICE:-${PROJECT_NAME}-frontend-service}"
ECS_BACKEND_SERVICE="${ECS_BACKEND_SERVICE:-${PROJECT_NAME}-backend-service}"

ALB_NAME="${ALB_NAME:-${PROJECT_NAME}-alb}"
TG_FRONTEND_NAME="${TG_FRONTEND_NAME:-${PROJECT_NAME}-fe-tg}"
TG_BACKEND_NAME="${TG_BACKEND_NAME:-${PROJECT_NAME}-be-tg}"

LOG_GROUP_BACKEND="/ecs/${PROJECT_NAME}-backend"
LOG_GROUP_FRONTEND="/ecs/${PROJECT_NAME}-frontend"
EXECUTION_ROLE_ARN="${EXECUTION_ROLE_ARN:-arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole}"

BE_CONTAINER_NAME="paimana-backend"
FE_CONTAINER_NAME="paimana-frontend"
BE_CONTAINER_PORT=8000
FE_CONTAINER_PORT=3000
BE_HEALTH_PATH="/api/v1/health"
FE_HEALTH_PATH="/"

echo "[+] Deployment Targets:"
echo "    - AWS Account ID:     ${AWS_ACCOUNT_ID}"
echo "    - Caller ARN:         ${CALLER_ARN}"
echo "    - AWS Region:         ${AWS_REGION}"
echo "    - Immutable Tag:      ${IMAGE_TAG}"
echo "    - ECS Cluster:        ${ECS_CLUSTER_NAME}"
echo "    - Backend Service:    ${ECS_BACKEND_SERVICE}"
echo "    - Frontend Service:   ${ECS_FRONTEND_SERVICE}"
echo "    - Backend ECR Image:  ${BACKEND_IMAGE_URI}"
echo "    - Frontend ECR Image: ${FRONTEND_IMAGE_URI}"

# ------------------------------------------------------------------------------
# 3. Pre-Flight Infrastructure Validation Mode
# ------------------------------------------------------------------------------
echo "[+] Validating required pre-existing AWS infrastructure..."

MISSING_RESOURCES=()

# 3.1 Validate ECR Repositories
if ! aws ecr describe-repositories --region "$AWS_REGION" --repository-names "${ECR_BACKEND_REPO}" >/dev/null 2>&1; then
    MISSING_RESOURCES+=("ECR Repository: ${ECR_BACKEND_REPO}")
fi
if ! aws ecr describe-repositories --region "$AWS_REGION" --repository-names "${ECR_FRONTEND_REPO}" >/dev/null 2>&1; then
    MISSING_RESOURCES+=("ECR Repository: ${ECR_FRONTEND_REPO}")
fi

# 3.2 Validate ECS Cluster
CLUSTER_STATUS="$(aws ecs describe-clusters --region "$AWS_REGION" \
    --clusters "${ECS_CLUSTER_NAME}" --query "clusters[0].status" --output text 2>/dev/null || echo "MISSING")"
if [ "$CLUSTER_STATUS" != "ACTIVE" ]; then
    MISSING_RESOURCES+=("ECS Cluster: ${ECS_CLUSTER_NAME} (Status: ${CLUSTER_STATUS})")
fi

# 3.3 Validate ALB & Target Groups
ALB_ARN="$(aws elbv2 describe-load-balancers --region "$AWS_REGION" \
    --names "${ALB_NAME}" --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "")"
if [ -z "$ALB_ARN" ] || [ "$ALB_ARN" = "None" ]; then
    MISSING_RESOURCES+=("Application Load Balancer: ${ALB_NAME}")
fi

TG_BE_ARN="$(aws elbv2 describe-target-groups --region "$AWS_REGION" \
    --names "${TG_BACKEND_NAME}" --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "")"
if [ -z "$TG_BE_ARN" ] || [ "$TG_BE_ARN" = "None" ]; then
    MISSING_RESOURCES+=("Target Group: ${TG_BACKEND_NAME}")
fi

TG_FE_ARN="$(aws elbv2 describe-target-groups --region "$AWS_REGION" \
    --names "${TG_FRONTEND_NAME}" --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "")"
if [ -z "$TG_FE_ARN" ] || [ "$TG_FE_ARN" = "None" ]; then
    MISSING_RESOURCES+=("Target Group: ${TG_FRONTEND_NAME}")
fi

# 3.4 Validate ECS Services
if [ "$CLUSTER_STATUS" = "ACTIVE" ]; then
    BE_SVC="$(aws ecs describe-services --region "$AWS_REGION" --cluster "${ECS_CLUSTER_NAME}" \
        --services "${ECS_BACKEND_SERVICE}" --query "services[?status=='ACTIVE'].serviceName" --output text 2>/dev/null || echo "")"
    if [ -z "$BE_SVC" ]; then
        MISSING_RESOURCES+=("ECS Service: ${ECS_BACKEND_SERVICE}")
    fi

    FE_SVC="$(aws ecs describe-services --region "$AWS_REGION" --cluster "${ECS_CLUSTER_NAME}" \
        --services "${ECS_FRONTEND_SERVICE}" --query "services[?status=='ACTIVE'].serviceName" --output text 2>/dev/null || echo "")"
    if [ -z "$FE_SVC" ]; then
        MISSING_RESOURCES+=("ECS Service: ${ECS_FRONTEND_SERVICE}")
    fi
fi

# Check validation outcome
if [ ${#MISSING_RESOURCES[@]} -gt 0 ]; then
    echo ""
    echo "[-] PRE-FLIGHT CHECK FAILED: The following required infrastructure is missing:" >&2
    for item in "${MISSING_RESOURCES[@]}"; do
        echo "    * ${item}" >&2
    done
    echo ""
    echo "    Per the two-phase deployment architecture, normal application deployment" >&2
    echo "    does not create infrastructure automatically." >&2
    echo "    Please run the one-time setup script first:" >&2
    echo "      ./scripts/bootstrap-infrastructure.sh --approve" >&2
    echo ""
    exit 1
fi

echo "[+] Pre-flight validation SUCCESS: All required infrastructure exists."

# Resolve ALB DNS for frontend build and health verification
ALB_DNS_NAME="$(aws elbv2 describe-load-balancers --region "$AWS_REGION" \
    --load-balancer-arns "${ALB_ARN}" --query "LoadBalancers[0].DNSName" --output text)"
echo "    - Public ALB DNS: ${ALB_DNS_NAME}"

if [ "$DRY_RUN" = true ]; then
    echo "===================================================================="
    echo " [DRY-RUN MODE] Pre-flight validation passed. No images built or deployed."
    echo "===================================================================="
    exit 0
fi

# ------------------------------------------------------------------------------
# 4. Authenticate Docker to Amazon ECR
# ------------------------------------------------------------------------------
echo "[+] Authenticating Docker client to Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# ------------------------------------------------------------------------------
# 5. Build, Tag & Push Backend Image
# ------------------------------------------------------------------------------
echo "[+] Building and pushing Backend image (${BACKEND_IMAGE_URI})..."
docker build -t "${BACKEND_IMAGE_URI}" -f backend/Dockerfile .
docker tag "${BACKEND_IMAGE_URI}" "${ECR_REGISTRY}/${ECR_BACKEND_REPO}:latest"
docker push "${BACKEND_IMAGE_URI}"
docker push "${ECR_REGISTRY}/${ECR_BACKEND_REPO}:latest"

# ------------------------------------------------------------------------------
# 6. Build, Tag & Push Frontend Image
# ------------------------------------------------------------------------------
echo "[+] Building and pushing Frontend image (${FRONTEND_IMAGE_URI})..."
echo "    - Build Args: BACKEND_URL=http://${ALB_DNS_NAME}, INTERNAL_API_URL=http://${ALB_DNS_NAME}/api/v1"
docker build \
    --build-arg BACKEND_URL="http://${ALB_DNS_NAME}" \
    --build-arg INTERNAL_API_URL="http://${ALB_DNS_NAME}/api/v1" \
    -t "${FRONTEND_IMAGE_URI}" -f frontend/Dockerfile frontend/
docker tag "${FRONTEND_IMAGE_URI}" "${ECR_REGISTRY}/${ECR_FRONTEND_REPO}:latest"
docker push "${FRONTEND_IMAGE_URI}"
docker push "${ECR_REGISTRY}/${ECR_FRONTEND_REPO}:latest"

# ------------------------------------------------------------------------------
# 7. Register Updated Task Definitions with Immutable Git Commit Tag
# ------------------------------------------------------------------------------
echo "[+] Registering updated ECS task definitions with tag: ${IMAGE_TAG}..."

JWT_SECRET_VAL="${JWT_SECRET:-nirman-drishti-mospi-jwt-secret-key-2026-production}"
CORS_ORIGINS_VAL="http://${ALB_DNS_NAME},https://${ALB_DNS_NAME},http://localhost:3000,http://127.0.0.1:3000"

BACKEND_TASK_DEF=$(cat <<EOF
{
  "family": "${PROJECT_NAME}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${EXECUTION_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "${BE_CONTAINER_NAME}",
      "image": "${BACKEND_IMAGE_URI}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": ${BE_CONTAINER_PORT},
          "hostPort": ${BE_CONTAINER_PORT},
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "HOST", "value": "0.0.0.0"},
        {"name": "PORT", "value": "8000"},
        {"name": "DATA_STATUS", "value": "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS"},
        {"name": "JWT_SECRET", "value": "${JWT_SECRET_VAL}"},
        {"name": "ACCESS_TOKEN_EXPIRE_MINUTES", "value": "720"},
        {"name": "CORS_ORIGINS", "value": "${CORS_ORIGINS_VAL}"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${LOG_GROUP_BACKEND}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF
)

BACKEND_TASK_ARN="$(aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json "$BACKEND_TASK_DEF" --query "taskDefinition.taskDefinitionArn" --output text)"
echo "    - Backend Task Definition:  ${BACKEND_TASK_ARN}"

FRONTEND_TASK_DEF=$(cat <<EOF
{
  "family": "${PROJECT_NAME}-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${EXECUTION_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "${FE_CONTAINER_NAME}",
      "image": "${FRONTEND_IMAGE_URI}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": ${FE_CONTAINER_PORT},
          "hostPort": ${FE_CONTAINER_PORT},
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "NEXT_TELEMETRY_DISABLED", "value": "1"},
        {"name": "BACKEND_URL", "value": "http://${ALB_DNS_NAME}"},
        {"name": "INTERNAL_API_URL", "value": "http://${ALB_DNS_NAME}/api/v1"},
        {"name": "PORT", "value": "3000"},
        {"name": "HOSTNAME", "value": "0.0.0.0"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${LOG_GROUP_FRONTEND}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF
)

FRONTEND_TASK_ARN="$(aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json "$FRONTEND_TASK_DEF" --query "taskDefinition.taskDefinitionArn" --output text)"
echo "    - Frontend Task Definition: ${FRONTEND_TASK_ARN}"

# ------------------------------------------------------------------------------
# 8. Update Existing ECS Services
# ------------------------------------------------------------------------------
echo "[+] Updating existing ECS services with new task definitions..."

aws ecs update-service --region "$AWS_REGION" \
    --cluster "${ECS_CLUSTER_NAME}" \
    --service "${ECS_BACKEND_SERVICE}" \
    --task-definition "${BACKEND_TASK_ARN}" \
    --desired-count 1 \
    --force-new-deployment >/dev/null
echo "    - Backend service updated to ${BACKEND_TASK_ARN}"

aws ecs update-service --region "$AWS_REGION" \
    --cluster "${ECS_CLUSTER_NAME}" \
    --service "${ECS_FRONTEND_SERVICE}" \
    --task-definition "${FRONTEND_TASK_ARN}" \
    --desired-count 1 \
    --force-new-deployment >/dev/null
echo "    - Frontend service updated to ${FRONTEND_TASK_ARN}"

# ------------------------------------------------------------------------------
# 9. Await Service Stability
# ------------------------------------------------------------------------------
echo "[+] Waiting for ECS services to reach stable state..."
aws ecs wait services-stable --region "$AWS_REGION" \
    --cluster "${ECS_CLUSTER_NAME}" \
    --services "${ECS_BACKEND_SERVICE}" "${ECS_FRONTEND_SERVICE}"
echo "[+] ECS services report STABLE."

# ------------------------------------------------------------------------------
# 10. Verify Target Group Health
# ------------------------------------------------------------------------------
echo "[+] Verifying ALB target health..."
TIMEOUT=300
ELAPSED=0
ALL_HEALTHY=false

while [ $ELAPSED -lt $TIMEOUT ]; do
    BE_HEALTH="$(aws elbv2 describe-target-health --region "$AWS_REGION" \
        --target-group-arn "${TG_BE_ARN}" --query "TargetHealthDescriptions[].TargetHealth.State" --output text 2>/dev/null || echo "")"
    FE_HEALTH="$(aws elbv2 describe-target-health --region "$AWS_REGION" \
        --target-group-arn "${TG_FE_ARN}" --query "TargetHealthDescriptions[].TargetHealth.State" --output text 2>/dev/null || echo "")"

    echo "    - [${ELAPSED}s/${TIMEOUT}s] Target health -> Backend: [${BE_HEALTH:-pending}] | Frontend: [${FE_HEALTH:-pending}]"

    if [[ "$BE_HEALTH" =~ "healthy" ]] && [[ "$FE_HEALTH" =~ "healthy" ]]; then
        ALL_HEALTHY=true
        break
    fi

    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

if [ "$ALL_HEALTHY" != "true" ]; then
    echo "[-] Warning: Target groups did not reach healthy state within ${TIMEOUT}s." >&2
    exit 1
fi
echo "[+] Target health verified: HEALTHY."

# ------------------------------------------------------------------------------
# 11. Application Health Verification
# ------------------------------------------------------------------------------
echo "[+] Running live application health checks against: http://${ALB_DNS_NAME}..."
FE_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://${ALB_DNS_NAME}/" || true)"
BE_JSON="$(curl -s -f "http://${ALB_DNS_NAME}${BE_HEALTH_PATH}" || true)"

echo "    - Frontend Root Status: HTTP ${FE_CODE}"
echo "    - Backend Health Response: ${BE_JSON}"

echo "===================================================================="
echo " MoSPI PAIMANA Application Deployment Succeeded!"
echo " Public Application URL:  http://${ALB_DNS_NAME}/"
echo " Backend Health API:      http://${ALB_DNS_NAME}${BE_HEALTH_PATH}"
echo " Interactive Swagger UI:  http://${ALB_DNS_NAME}/api/v1/docs"
echo " Deployed Image Tag:      ${IMAGE_TAG}"
echo "===================================================================="
