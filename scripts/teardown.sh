#!/usr/bin/env bash
# ==============================================================================
# MoSPI PAIMANA Early-Warning & Predictive Analytics Platform (SIH26103)
# Teardown Script: Safely Decommissions Chargeable AWS ECS & ALB Resources
# ==============================================================================

set -Eeuo pipefail

echo "===================================================================="
echo " MoSPI PAIMANA AWS Resource Teardown & Cost-Control Protocol"
echo "===================================================================="

CONFIRM="${1:-}"
if [ "$CONFIRM" != "--yes" ] && [ "$CONFIRM" != "-y" ]; then
    echo "Warning: This script will delete the ECS services, tasks, ALB, and target groups."
    echo "To proceed, run: ./scripts/teardown.sh --yes"
    exit 1
fi

AWS_REGION="${AWS_REGION:-ap-south-1}"
PROJECT_NAME="${PROJECT_NAME:-paimana}"
ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-${PROJECT_NAME}-cluster}"
ECS_FRONTEND_SERVICE="${ECS_FRONTEND_SERVICE:-${PROJECT_NAME}-frontend-service}"
ECS_BACKEND_SERVICE="${ECS_BACKEND_SERVICE:-${PROJECT_NAME}-backend-service}"
ALB_NAME="${ALB_NAME:-${PROJECT_NAME}-alb}"
TG_FRONTEND_NAME="${TG_FRONTEND_NAME:-${PROJECT_NAME}-fe-tg}"
TG_BACKEND_NAME="${TG_BACKEND_NAME:-${PROJECT_NAME}-be-tg}"
ALB_SG_NAME="${ALB_SG_NAME:-${PROJECT_NAME}-alb-sg}"
ECS_SG_NAME="${ECS_SG_NAME:-${PROJECT_NAME}-ecs-sg}"
LOG_GROUP_BACKEND="/ecs/${PROJECT_NAME}-backend"
LOG_GROUP_FRONTEND="/ecs/${PROJECT_NAME}-frontend"

echo "[+] Step 1: Scaling down and removing ECS services..."
for SVC in "$ECS_FRONTEND_SERVICE" "$ECS_BACKEND_SERVICE"; do
    if aws ecs describe-services --region "$AWS_REGION" --cluster "$ECS_CLUSTER_NAME" --services "$SVC" --query "services[?status=='ACTIVE'].serviceName" --output text 2>/dev/null | grep -q "$SVC"; then
        echo "    - Scaling $SVC to 0 desired count..."
        aws ecs update-service --region "$AWS_REGION" --cluster "$ECS_CLUSTER_NAME" --service "$SVC" --desired-count 0 >/dev/null 2>&1 || true
        echo "    - Deleting service $SVC..."
        aws ecs delete-service --region "$AWS_REGION" --cluster "$ECS_CLUSTER_NAME" --service "$SVC" --force >/dev/null 2>&1 || true
    fi
done

echo "[+] Step 2: Deleting ECS Cluster: $ECS_CLUSTER_NAME..."
aws ecs delete-cluster --region "$AWS_REGION" --cluster "$ECS_CLUSTER_NAME" >/dev/null 2>&1 || true

echo "[+] Step 3: Deleting Application Load Balancer..."
ALB_ARN="$(aws elbv2 describe-load-balancers --region "$AWS_REGION" --names "$ALB_NAME" --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "")"
if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
    echo "    - Deleting ALB: $ALB_ARN"
    aws elbv2 delete-load-balancer --region "$AWS_REGION" --load-balancer-arn "$ALB_ARN"
    echo "    - Waiting for ALB deletion..."
    aws elbv2 wait load-balancers-deleted --region "$AWS_REGION" --load-balancer-arns "$ALB_ARN" 2>/dev/null || sleep 15
fi

echo "[+] Step 4: Deleting Target Groups..."
for TG in "$TG_BACKEND_NAME" "$TG_FRONTEND_NAME"; do
    TG_ARN="$(aws elbv2 describe-target-groups --region "$AWS_REGION" --names "$TG" --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "")"
    if [ -n "$TG_ARN" ] && [ "$TG_ARN" != "None" ]; then
        echo "    - Deleting target group: $TG"
        aws elbv2 delete-target-group --region "$AWS_REGION" --target-group-arn "$TG_ARN" >/dev/null 2>&1 || true
    fi
done

echo "[+] Step 5: Deleting CloudWatch Log Groups..."
aws logs delete-log-group --region "$AWS_REGION" --log-group-name "$LOG_GROUP_BACKEND" >/dev/null 2>&1 || true
aws logs delete-log-group --region "$AWS_REGION" --log-group-name "$LOG_GROUP_FRONTEND" >/dev/null 2>&1 || true

echo "[+] Step 6: Cleaning up Security Groups..."
sleep 10 # Wait for ENIs to detach
VPC_ID="$(aws ec2 describe-vpcs --region "$AWS_REGION" --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text 2>/dev/null || echo "")"
if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
    for SG in "$ECS_SG_NAME" "$ALB_SG_NAME"; do
        SG_ID="$(aws ec2 describe-security-groups --region "$AWS_REGION" --filters "Name=group-name,Values=$SG" "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "")"
        if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
            echo "    - Deleting security group: $SG ($SG_ID)"
            aws ec2 delete-security-group --region "$AWS_REGION" --group-id "$SG_ID" >/dev/null 2>&1 || true
        fi
    done
fi

echo "===================================================================="
echo " MoSPI PAIMANA Teardown Completed Successfully."
echo " Note: ECR images and raw datasets are preserved."
echo "===================================================================="
