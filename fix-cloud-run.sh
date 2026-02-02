#!/bin/bash
# Script to fix Cloud Run configuration for pdf2md-test service

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

SERVICE_NAME="pdf2md-test"
REGION="australia-southeast1"

print_header "Cloud Run 配置修复脚本"

echo "此脚本将更新 Cloud Run 服务配置以修复转换失败问题"
echo ""
echo "服务: ${SERVICE_NAME}"
echo "区域: ${REGION}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud 命令未找到。请先安装 Google Cloud SDK"
    print_info "访问: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

print_info "gcloud 已安装"

# Step 1: Check current configuration
print_header "步骤 1: 检查当前配置"

echo "获取当前服务配置..."
CURRENT_MEMORY=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(spec.template.spec.containers[0].resources.limits.memory)" 2>/dev/null || echo "unknown")

CURRENT_TIMEOUT=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(spec.template.spec.timeoutSeconds)" 2>/dev/null || echo "unknown")

CURRENT_CPU=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(spec.template.spec.containers[0].resources.limits.cpu)" 2>/dev/null || echo "unknown")

echo ""
echo "当前配置:"
echo "  内存: ${CURRENT_MEMORY}"
echo "  超时: ${CURRENT_TIMEOUT}秒"
echo "  CPU: ${CURRENT_CPU}"
echo ""

# Step 2: Update configuration
print_header "步骤 2: 更新服务配置"

echo "正在更新配置..."
echo ""

# Recommended configuration for Marker AI
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --memory=2Gi \
  --cpu=2 \
  --timeout=3600s \
  --max-instances=2 \
  --concurrency=1 \
  --execution-environment=gen2 \
  --quiet

if [ $? -eq 0 ]; then
    print_info "配置更新成功！"
else
    print_error "配置更新失败"
    exit 1
fi

# Step 3: Verify new configuration
print_header "步骤 3: 验证新配置"

NEW_MEMORY=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(spec.template.spec.containers[0].resources.limits.memory)")

NEW_TIMEOUT=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(spec.template.spec.timeoutSeconds)")

NEW_CPU=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(spec.template.spec.containers[0].resources.limits.cpu)")

echo ""
echo "新配置:"
echo "  内存: ${NEW_MEMORY} (推荐: 2Gi)"
echo "  超时: ${NEW_TIMEOUT}秒 (推荐: 3600s)"
echo "  CPU: ${NEW_CPU} (推荐: 2)"
echo ""

# Step 4: Test service
print_header "步骤 4: 测试服务"

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(status.url)")

echo "服务 URL: ${SERVICE_URL}"
echo ""

# Test health endpoint
echo "测试健康检查端点..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${SERVICE_URL}/api/health" || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_info "健康检查通过 (HTTP ${HTTP_CODE})"
    echo "响应: ${RESPONSE_BODY}"
else
    print_warn "健康检查失败 (HTTP ${HTTP_CODE})"
    echo "响应: ${RESPONSE_BODY}"
fi

echo ""

# Test debug endpoint
echo "测试诊断端点..."
DEBUG_RESPONSE=$(curl -s -w "\n%{http_code}" "${SERVICE_URL}/api/debug" || echo "000")
HTTP_CODE=$(echo "$DEBUG_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DEBUG_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_info "诊断端点通过 (HTTP ${HTTP_CODE})"
    echo "响应: ${RESPONSE_BODY}"

    # Check if marker service is healthy
    if echo "$RESPONSE_BODY" | grep -q '"health"'; then
        print_info "Marker 服务运行正常"
    else
        print_warn "Marker 服务可能未运行"
        echo ""
        print_info "查看日志:"
        echo "  gcloud run services logs read ${SERVICE_NAME} --region=${REGION} --limit=50"
    fi
else
    print_warn "诊断端点失败 (HTTP ${HTTP_CODE})"
    echo "响应: ${RESPONSE_BODY}"
fi

# Step 5: Summary and next steps
print_header "完成！"

echo -e "${GREEN}配置已更新：${NC}"
echo "  ✓ 内存: ${CURRENT_MEMORY} → ${NEW_MEMORY}"
echo "  ✓ CPU: ${CURRENT_CPU} → ${NEW_CPU}"
echo "  ✓ 超时: ${CURRENT_TIMEOUT}s → ${NEW_TIMEOUT}s"
echo ""

echo -e "${YELLOW}下一步操作：${NC}"
echo "  1. 等待 1-2 分钟让服务重新部署"
echo "  2. 访问 ${SERVICE_URL}"
echo "  3. 上传 PDF 文件测试转换"
echo ""

echo -e "${BLUE}监控日志（实时）：${NC}"
echo "  gcloud run services logs tail ${SERVICE_NAME} --region=${REGION}"
echo ""

echo -e "${BLUE}查看最近日志：${NC}"
echo "  gcloud run services logs read ${SERVICE_NAME} --region=${REGION} --limit=50"
echo ""

print_info "如果转换仍然失败，请查看 TROUBLESHOOTING.md 文件"
