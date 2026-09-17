#!/usr/bin/env bash
# ==============================================================================
# MoSPI PAIMANA Early-Warning & Predictive Analytics Platform (SIH26103)
# Phase 1: One-Time Infrastructure Setup (Manual & Approval-Based)
# ==============================================================================
# This script provisions foundational AWS infrastructure:
#   - ECR repositories
#   - Security groups (ALB SG and least-privilege ECS SG)
#   - Application Load Balancer (ALB) & Listeners / Path-based rules
#   - Target groups (Frontend port 3000, Backend port 8000)
#   - CloudWatch log groups
#   - Amazon ECS Cluster & baseline ECS Fargate services
#
# IMPORTANT:
#   - Must be executed ONCE with explicit approval.
#   - Must NOT run automatically on every GitHub Actions push.
# ==============================================================================

set -Eeuo pipefail
trap 'echo "[-] Error on line $LINENO in bootstrap-infrastructure.sh" >&2' ERR

AWS_REGION="${AWS_REGION:-ap-south-1}"
PROJECT_NAME="${PROJECT_NAME:-paimana}"

# Resource Identifiers
ALB_NAME="${ALB_NAME:-${PROJECT_NAME}-alb}"
TG_FRONTEND_NAME="${TG_FRONTEND_NAME:-${PROJECT_NAME}-fe-tg}"
TG_BACKEND_NAME="${TG_BACKEND_NAME:-${PROJECT_NAME}-be-tg}"
ALB_SG_NAME="${ALB_SG_NAME:-${PROJECT_NAME}-alb-sg}"
ECS_SG_NAME="${ECS_SG_NAME:-${PROJECT_NAME}-ecs-sg}"
ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-${PROJECT_NAME}-cluster}"
ECS_FRONTEND_SERVICE="${ECS_FRONTEND_SERVICE:-${PROJECT_NAME}-frontend-service}"
ECS_BACKEND_SERVICE="${ECS_BACKEND_SERVICE:-${PROJECT_NAME}-backend-service}"
ECR_FRONTEND_REPO="${ECR_FRONTEND_REPO:-${PROJECT_NAME}-frontend}"
ECR_BACKEND_REPO="${ECR_BACKEND_REPO:-${PROJECT_NAME}-backend}"
LOG_GROUP_BACKEND="/ecs/${PROJECT_NAME}-backend"
LOG_GROUP_FRONTEND="/ecs/${PROJECT_NAME}-frontend"

CALLER_IDENTITY="$(aws sts get-caller-identity --output json)"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(echo "$CALLER_IDENTITY" | jq -r '.Account')}"
EXECUTION_ROLE_ARN="${EXECUTION_ROLE_ARN:-arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole}"

echo "===================================================================="
echo " MoSPI PAIMANA Phase 1: One-Time Infrastructure Setup"
echo "===================================================================="
echo " Target Region:        ${AWS_REGION}"
echo " AWS Account ID:       ${AWS_ACCOUNT_ID}"
echo " Project Prefix:       ${PROJECT_NAME}"
echo " ECS Cluster:          ${ECS_CLUSTER_NAME}"
echo " ECR Repositories:     ${ECR_FRONTEND_REPO}, ${ECR_BACKEND_REPO}"
echo " ALB Name:             ${ALB_NAME}"
echo " Target Groups:        ${TG_FRONTEND_NAME} (:3000), ${TG_BACKEND_NAME} (:8000)"
echo " ECS Services:         ${ECS_FRONTEND_SERVICE}, ${ECS_BACKEND_SERVICE}"
echo "===================================================================="

# Require explicit confirmation
if [[ "${1:-}" != "--approve" ]]; then
    echo ""
    echo "[!] SAFETY CHECK: This script provisions cloud infrastructure."
    echo "    To approve and execute resource creation, run:"
    echo "    ./scripts/bootstrap-infrastructure.sh --approve"
    echo ""
    exit 0
fi

echo "[+] Approval confirmed. Starting one-time infrastructure setup..."

# ------------------------------------------------------------------------------
# 1. Discover VPC and Multi-AZ Subnets
# ------------------------------------------------------------------------------
echo "[+] 1/7 Discovering VPC and subnets..."
VPC_ID="${VPC_ID:-}"
if [ -z "$VPC_ID" ]; then
    VPC_ID="$(aws ec2 describe-vpcs --region "$AWS_REGION" --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)"
    if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
        VPC_ID="$(aws ec2 describe-vpcs --region "$AWS_REGION" --query "Vpcs[0].VpcId" --output text)"
    fi
fi

if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ]; then
    echo "[-] Fatal: No VPC found in region ${AWS_REGION}." >&2
    exit 1
fi
echo "    - Target VPC: ${VPC_ID}"

SUBNET_JSON="$(aws ec2 describe-subnets --region "$AWS_REGION" --filters "Name=vpc-id,Values=${VPC_ID}" --query "Subnets[].[SubnetId,AvailabilityZone]" --output json)"
SUBNET_IDS=($(echo "$SUBNET_JSON" | jq -r 'group_by(.[1]) | map(.[0][0]) | .[]'))

if [ ${#SUBNET_IDS[@]} -lt 2 ]; then
    echo "[-] Fatal: ALB requires at least 2 subnets in different Availability Zones. Found: ${#SUBNET_IDS[@]}" >&2
    exit 1
fi
SUBNET_ARGS="${SUBNET_IDS[@]}"
SUBNET_CSV="$(IFS=,; echo "${SUBNET_IDS[*]}")"
echo "    - Multi-AZ Subnets: ${SUBNET_CSV}"

# ------------------------------------------------------------------------------
# 2. Security Groups Setup
# ------------------------------------------------------------------------------
echo "[+] 2/7 Configuring security groups (least privilege)..."

# ALB Security Group (Port 80 ingress)
ALB_SG_ID="$(aws ec2 describe-security-groups --region "$AWS_REGION" \
    --filters "Name=group-name,Values=${ALB_SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
    --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")"

if [ "$ALB_SG_ID" = "None" ] || [ -z "$ALB_SG_ID" ]; then
    echo "    - Creating ALB security group: ${ALB_SG_NAME}"
    ALB_SG_ID="$(aws ec2 create-security-group --region "$AWS_REGION" \
        --group-name "${ALB_SG_NAME}" \
        --description "Security Group for MoSPI PAIMANA ALB" \
        --vpc-id "${VPC_ID}" \
        --query "GroupId" --output text)"
    aws ec2 authorize-security-group-ingress --region "$AWS_REGION" \
        --group-id "${ALB_SG_ID}" \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 >/dev/null
else
    echo "    - Existing ALB security group: ${ALB_SG_ID}"
fi

# ECS Security Group (Ingress only from ALB SG)
ECS_SG_ID="$(aws ec2 describe-security-groups --region "$AWS_REGION" \
    --filters "Name=group-name,Values=${ECS_SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
    --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")"

if [ "$ECS_SG_ID" = "None" ] || [ -z "$ECS_SG_ID" ]; then
    echo "    - Creating ECS task security group: ${ECS_SG_NAME}"
    ECS_SG_ID="$(aws ec2 create-security-group --region "$AWS_REGION" \
        --group-name "${ECS_SG_NAME}" \
        --description "Security Group for MoSPI PAIMANA ECS Tasks" \
        --vpc-id "${VPC_ID}" \
        --query "GroupId" --output text)"
    aws ec2 authorize-security-group-ingress --region "$AWS_REGION" \
        --group-id "${ECS_SG_ID}" \
        --protocol tcp --port 3000 --source-group "${ALB_SG_ID}" >/dev/null
    aws ec2 authorize-security-group-ingress --region "$AWS_REGION" \
        --group-id "${ECS_SG_ID}" \
        --protocol tcp --port 8000 --source-group "${ALB_SG_ID}" >/dev/null
    aws ec2 authorize-security-group-ingress --region "$AWS_REGION" \
        --group-id "${ECS_SG_ID}" \
        --protocol tcp --port 8000 --source-group "${ECS_SG_ID}" >/dev/null
else
    echo "    - Existing ECS task security group: ${ECS_SG_ID}"
fi

# ------------------------------------------------------------------------------
# 3. Target Groups Setup
# ------------------------------------------------------------------------------
echo "[+] 3/7 Configuring Target Groups..."

# Backend Target Group (Port 8000, target type IP for Fargate)
TG_BACKEND_ARN="$(aws elbv2 describe-target-groups --region "$AWS_REGION" \
    --names "${TG_BACKEND_NAME}" --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "None")"

if [ "$TG_BACKEND_ARN" = "None" ] || [ -z "$TG_BACKEND_ARN" ]; then
    echo "    - Creating Backend target group: ${TG_BACKEND_NAME}"
    TG_BACKEND_ARN="$(aws elbv2 create-target-group --region "$AWS_REGION" \
        --name "${TG_BACKEND_NAME}" \
        --protocol HTTP \
        --port 8000 \
        --vpc-id "${VPC_ID}" \
        --target-type ip \
        --health-check-protocol HTTP \
        --health-check-port 8000 \
        --health-check-path "/api/v1/health" \
        --health-check-interval-seconds 15 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --matcher "HttpCode=200" \
        --query "TargetGroups[0].TargetGroupArn" --output text)"
else
    echo "    - Existing Backend target group: ${TG_BACKEND_ARN}"
fi

# Frontend Target Group (Port 3000, target type IP for Fargate)
TG_FRONTEND_ARN="$(aws elbv2 describe-target-groups --region "$AWS_REGION" \
    --names "${TG_FRONTEND_NAME}" --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "None")"

if [ "$TG_FRONTEND_ARN" = "None" ] || [ -z "$TG_FRONTEND_ARN" ]; then
    echo "    - Creating Frontend target group: ${TG_FRONTEND_NAME}"
    TG_FRONTEND_ARN="$(aws elbv2 create-target-group --region "$AWS_REGION" \
        --name "${TG_FRONTEND_NAME}" \
        --protocol HTTP \
        --port 3000 \
        --vpc-id "${VPC_ID}" \
        --target-type ip \
        --health-check-protocol HTTP \
        --health-check-port 3000 \
        --health-check-path "/" \
        --health-check-interval-seconds 15 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --matcher "HttpCode=200" \
        --query "TargetGroups[0].TargetGroupArn" --output text)"
else
    echo "    - Existing Frontend target group: ${TG_FRONTEND_ARN}"
fi

# ------------------------------------------------------------------------------
# 4. Application Load Balancer & Routing Rules Setup
# ------------------------------------------------------------------------------
echo "[+] 4/7 Configuring Application Load Balancer and Routing..."

ALB_ARN="$(aws elbv2 describe-load-balancers --region "$AWS_REGION" \
    --names "${ALB_NAME}" --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "None")"

if [ "$ALB_ARN" = "None" ] || [ -z "$ALB_ARN" ]; then
    echo "    - Creating internet-facing ALB: ${ALB_NAME}"
    ALB_ARN="$(aws elbv2 create-load-balancer --region "$AWS_REGION" \
        --name "${ALB_NAME}" \
        --subnets ${SUBNET_ARGS} \
        --security-groups "${ALB_SG_ID}" \
        --scheme internet-facing \
        --type application \
        --ip-address-type ipv4 \
        --query "LoadBalancers[0].LoadBalancerArn" --output text)"
    
    echo "    - Waiting for ALB to become active..."
    aws elbv2 wait load-balancer-available --region "$AWS_REGION" --load-balancer-arns "${ALB_ARN}"
else
    echo "    - Existing ALB: ${ALB_ARN}"
fi

ALB_DNS_NAME="$(aws elbv2 describe-load-balancers --region "$AWS_REGION" \
    --load-balancer-arns "${ALB_ARN}" --query "LoadBalancers[0].DNSName" --output text)"
echo "    - Public ALB DNS: ${ALB_DNS_NAME}"

# Port 80 Listener (Default action: Forward to Frontend Target Group)
LISTENER_ARN="$(aws elbv2 describe-listeners --region "$AWS_REGION" \
    --load-balancer-arn "${ALB_ARN}" \
    --query "Listeners[?Port==\`80\`].ListenerArn" --output text 2>/dev/null || echo "None")"

if [ "$LISTENER_ARN" = "None" ] || [ -z "$LISTENER_ARN" ]; then
    echo "    - Creating HTTP port 80 listener..."
    LISTENER_ARN="$(aws elbv2 create-listener --region "$AWS_REGION" \
        --load-balancer-arn "${ALB_ARN}" \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn="${TG_FRONTEND_ARN}" \
        --query "Listeners[0].ListenerArn" --output text)"
else
    echo "    - Existing port 80 listener: ${LISTENER_ARN}"
fi

# Path-based rule: /api/* -> Backend Target Group
API_RULE_ARN="$(aws elbv2 describe-rules --region "$AWS_REGION" \
    --listener-arn "${LISTENER_ARN}" \
    --query "Rules[?Conditions[?Field=='path-pattern' && Values[?contains(@, '/api/*')]]].RuleArn" \
    --output text 2>/dev/null || echo "None")"

if [ "$API_RULE_ARN" = "None" ] || [ -z "$API_RULE_ARN" ]; then
    echo "    - Creating routing rule: /api/* -> Backend Target Group (Priority 10)"
    API_RULE_ARN="$(aws elbv2 create-rule --region "$AWS_REGION" \
        --listener-arn "${LISTENER_ARN}" \
        --priority 10 \
        --conditions Field=path-pattern,Values='/api/*' \
        --actions Type=forward,TargetGroupArn="${TG_BACKEND_ARN}" \
        --query "Rules[0].RuleArn" --output text)"
else
    echo "    - Existing /api/* routing rule: ${API_RULE_ARN}"
fi

# ------------------------------------------------------------------------------
# 5. CloudWatch Log Groups & ECS Cluster Setup
# ------------------------------------------------------------------------------
echo "[+] 5/7 Configuring CloudWatch Log Groups & ECS Cluster..."
aws logs create-log-group --region "$AWS_REGION" --log-group-name "${LOG_GROUP_BACKEND}" 2>/dev/null || true
aws logs create-log-group --region "$AWS_REGION" --log-group-name "${LOG_GROUP_FRONTEND}" 2>/dev/null || true

CLUSTER_STATUS="$(aws ecs describe-clusters --region "$AWS_REGION" \
    --clusters "${ECS_CLUSTER_NAME}" --query "clusters[0].status" --output text 2>/dev/null || echo "MISSING")"

if [ "$CLUSTER_STATUS" != "ACTIVE" ]; then
    echo "    - Creating ECS Cluster: ${ECS_CLUSTER_NAME}"
    aws ecs create-cluster --region "$AWS_REGION" --cluster-name "${ECS_CLUSTER_NAME}" >/dev/null
else
    echo "    - Existing active ECS cluster: ${ECS_CLUSTER_NAME}"
fi

# ------------------------------------------------------------------------------
# 6. ECR Repositories Setup
# ------------------------------------------------------------------------------
echo "[+] 6/7 Configuring Amazon ECR Repositories..."
aws ecr describe-repositories --region "$AWS_REGION" --repository-names "${ECR_BACKEND_REPO}" >/dev/null 2>&1 || \
    aws ecr create-repository --region "$AWS_REGION" --repository-name "${ECR_BACKEND_REPO}" --image-scanning-configuration scanOnPush=true >/dev/null

aws ecr describe-repositories --region "$AWS_REGION" --repository-names "${ECR_FRONTEND_REPO}" >/dev/null 2>&1 || \
    aws ecr create-repository --region "$AWS_REGION" --repository-name "${ECR_FRONTEND_REPO}" --image-scanning-configuration scanOnPush=true >/dev/null

echo "    - Backend ECR Repo:  ${ECR_BACKEND_REPO}"
echo "    - Frontend ECR Repo: ${ECR_FRONTEND_REPO}"

# ------------------------------------------------------------------------------
# 7. Baseline Task Definitions & Baseline ECS Services Registration
# ------------------------------------------------------------------------------
echo "[+] 7/7 Configuring baseline ECS Services..."

# Check or register baseline task definitions if not already present
BACKEND_TASK_ARN="$(aws ecs list-task-definitions --region "$AWS_REGION" --family-prefix "${PROJECT_NAME}-backend" --sort DESC --query "taskDefinitionArns[0]" --output text 2>/dev/null || echo "None")"
if [ "$BACKEND_TASK_ARN" = "None" ] || [ -z "$BACKEND_TASK_ARN" ]; then
    echo "    - Registering initial baseline backend task definition..."
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
      "name": "paimana-backend",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest",
      "essential": true,
      "portMappings": [{"containerPort": 8000, "hostPort": 8000, "protocol": "tcp"}],
      "environment": [
        {"name": "HOST", "value": "0.0.0.0"},
        {"name": "PORT", "value": "8000"},
        {"name": "DATA_STATUS", "value": "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS"},
        {"name": "JWT_SECRET", "value": "nirman-drishti-mospi-jwt-secret-key-2026-production"},
        {"name": "ACCESS_TOKEN_EXPIRE_MINUTES", "value": "720"},
        {"name": "CORS_ORIGINS", "value": "http://${ALB_DNS_NAME},http://localhost:3000"}
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
fi

FRONTEND_TASK_ARN="$(aws ecs list-task-definitions --region "$AWS_REGION" --family-prefix "${PROJECT_NAME}-frontend" --sort DESC --query "taskDefinitionArns[0]" --output text 2>/dev/null || echo "None")"
if [ "$FRONTEND_TASK_ARN" = "None" ] || [ -z "$FRONTEND_TASK_ARN" ]; then
    echo "    - Registering initial baseline frontend task definition..."
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
      "name": "paimana-frontend",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest",
      "essential": true,
      "portMappings": [{"containerPort": 3000, "hostPort": 3000, "protocol": "tcp"}],
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
fi

# Ensure ECS Services exist and are attached to the ALB Target Groups
BE_SVC_EXISTS="$(aws ecs describe-services --region "$AWS_REGION" --cluster "${ECS_CLUSTER_NAME}" --services "${ECS_BACKEND_SERVICE}" --query "services[?status=='ACTIVE'].serviceName" --output text 2>/dev/null || echo "")"
if [ -z "$BE_SVC_EXISTS" ]; then
    echo "    - Creating Backend ECS Service: ${ECS_BACKEND_SERVICE}"
    aws ecs create-service --region "$AWS_REGION" \
        --cluster "${ECS_CLUSTER_NAME}" \
        --service-name "${ECS_BACKEND_SERVICE}" \
        --task-definition "${BACKEND_TASK_ARN}" \
        --desired-count 0 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_CSV}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=${TG_BACKEND_ARN},containerName=paimana-backend,containerPort=8000" >/dev/null
else
    echo "    - Existing Backend ECS Service found: ${ECS_BACKEND_SERVICE}"
fi

FE_SVC_EXISTS="$(aws ecs describe-services --region "$AWS_REGION" --cluster "${ECS_CLUSTER_NAME}" --services "${ECS_FRONTEND_SERVICE}" --query "services[?status=='ACTIVE'].serviceName" --output text 2>/dev/null || echo "")"
if [ -z "$FE_SVC_EXISTS" ]; then
    echo "    - Creating Frontend ECS Service: ${ECS_FRONTEND_SERVICE}"
    aws ecs create-service --region "$AWS_REGION" \
        --cluster "${ECS_CLUSTER_NAME}" \
        --service-name "${ECS_FRONTEND_SERVICE}" \
        --task-definition "${FRONTEND_TASK_ARN}" \
        --desired-count 0 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_CSV}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=${TG_FRONTEND_ARN},containerName=paimana-frontend,containerPort=3000" >/dev/null
else
    echo "    - Existing Frontend ECS Service found: ${ECS_FRONTEND_SERVICE}"
fi

echo "===================================================================="
echo " Phase 1 Infrastructure Bootstrap Complete!"
echo "===================================================================="
echo " ALB DNS:              http://${ALB_DNS_NAME}"
echo " ECS Cluster:          ${ECS_CLUSTER_NAME}"
echo " Backend Service:      ${ECS_BACKEND_SERVICE}"
echo " Frontend Service:     ${ECS_FRONTEND_SERVICE}"
echo ""
echo " Now run Phase 2 (Application Deployment):"
echo "   ./scripts/deploy.sh [IMAGE_TAG]"
echo "===================================================================="
