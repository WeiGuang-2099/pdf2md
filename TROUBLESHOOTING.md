# Cloud Run 部署问题排查指南

## 🔍 问题：转换失败 "Conversion failed"

当你在 Cloud Run 上看到转换失败时，按以下步骤排查：

## 第一步：检查 Cloud Run 配置

### 1. 检查内存配置
Marker AI 模型需要至少 **2GB RAM**。默认的 512MB 不够。

```bash
# 更新 Cloud Run 服务内存
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --memory=2Gi \
  --timeout=3600s \
  --max-instances=2
```

### 2. 检查超时设置
确保超时足够长（最多 1 小时）：

```bash
gcloud run services describe pdf2md-test \
  --region=australia-southeast1 \
  --format="value(spec.template.spec.timeoutSeconds)"
```

## 第二步：查看实时日志

### 方法 1: 使用 gcloud 命令
```bash
# 查看最近的日志
gcloud run services logs read pdf2md-test \
  --region=australia-southeast1 \
  --limit=100

# 实时跟踪日志
gcloud run services logs tail pdf2md-test \
  --region=australia-southeast1
```

### 方法 2: 使用 Cloud Console
1. 访问 [Cloud Run Console](https://console.cloud.google.com/run)
2. 点击 `pdf2md-test` 服务
3. 点击 "LOGS" 标签
4. 查找 ERROR 或 WARN 级别的日志

## 第三步：测试服务健康状态

### 1. 测试前端健康检查
```bash
curl https://pdf2md-test-259381363877.australia-southeast1.run.app/api/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T..."
}
```

### 2. 测试诊断端点（新增）
```bash
curl https://pdf2md-test-259381363877.australia-southeast1.run.app/api/debug
```

**预期响应**:
```json
{
  "timestamp": "...",
  "environment": {
    "MARKER_PORT": "8001",
    "NODE_ENV": "production"
  },
  "markerService": {
    "health": {
      "status": "ok",
      "service": "marker-api"
    }
  }
}
```

**如果看到错误**：说明 Marker 服务未运行！

## 常见问题和解决方案

### ❌ 问题 1: "ECONNREFUSED" 或 "connect ECONNREFUSED"

**原因**: Marker 服务未启动

**解决方案**:
1. 检查启动脚本 `docker-entrypoint.sh` 是否正确
2. 检查 Python 依赖是否完整
3. 增加内存配置

```bash
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --memory=2Gi
```

### ❌ 问题 2: "Memory limit exceeded"

**原因**: 内存不足

**解决方案**:
```bash
# 增加到 4GB
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --memory=4Gi
```

### ❌ 问题 3: "Timeout" 或 "504 Gateway Timeout"

**原因**: 转换时间超过限制

**解决方案**:
```bash
# 设置 1 小时超时
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --timeout=3600s
```

### ❌ 问题 4: "Failed to import marker"

**原因**: Python 依赖未正确安装

**解决方案**:
1. 检查 `marker-service/requirements.txt`
2. 重新构建 Docker 镜像
3. 确保 Dockerfile 中 `pip install` 步骤成功

### ❌ 问题 5: Cold Start 超时

**原因**: 首次启动需要加载模型，时间过长

**解决方案**:
```bash
# 设置最小实例数为 1（保持一个实例始终运行）
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --min-instances=1
```

**注意**: 这会增加成本，因为会始终有一个实例运行。

## 第四步：本地测试

如果 Cloud Run 持续失败，先在本地测试：

```bash
# 构建镜像
docker build -t pdf2md-test .

# 运行容器
docker run -p 3000:3000 -p 8001:8001 \
  -e PORT=3000 \
  -e MARKER_PORT=8001 \
  -e TORCH_DEVICE=cpu \
  -e NODE_ENV=production \
  pdf2md-test

# 等待服务启动（约 30 秒）
sleep 30

# 测试转换
curl -X POST http://localhost:3000/api/convert \
  -F "file=@your-test.pdf"
```

## 第五步：查看详细错误

访问应用并打开浏览器开发者工具 (F12)：

1. 上传 PDF 文件
2. 点击转换
3. 在 "Network" 标签中查看 `/api/convert` 请求
4. 查看响应中的详细错误信息

## 推荐的 Cloud Run 配置

```bash
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=3600s \
  --max-instances=2 \
  --concurrency=1 \
  --execution-environment=gen2
```

**说明**:
- `--memory=2Gi`: 2GB 内存（Marker AI 最低要求）
- `--cpu=2`: 2 个 CPU（加快处理速度）
- `--timeout=3600s`: 1 小时超时
- `--max-instances=2`: 最多 2 个实例
- `--concurrency=1`: 每个实例同时处理 1 个请求（因为 Marker 消耗资源大）
- `--execution-environment=gen2`: 使用第二代执行环境（更多内存）

## 监控和日志

### 实时监控转换请求
```bash
# 持续监控日志
gcloud run services logs tail pdf2md-test \
  --region=australia-southeast1 \
  --format="table(timestamp,severity,textPayload)"
```

### 查看性能指标
1. 访问 [Cloud Run Metrics](https://console.cloud.google.com/run/detail/australia-southeast1/pdf2md-test/metrics)
2. 查看:
   - Request count（请求数）
   - Request latency（请求延迟）
   - Container instance count（实例数）
   - Memory utilization（内存使用率）
   - CPU utilization（CPU 使用率）

## 成本优化

如果担心成本：

### 方案 1: 按需运行（推荐）
```bash
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --min-instances=0 \
  --max-instances=1
```

**优点**: 无请求时不收费
**缺点**: Cold start 较慢（10-30 秒）

### 方案 2: 保持热启动
```bash
gcloud run services update pdf2md-test \
  --region=australia-southeast1 \
  --min-instances=1 \
  --max-instances=2
```

**优点**: 响应快速
**缺点**: 始终有一个实例运行（持续收费）

## 获取帮助

如果以上步骤都无法解决问题，请收集以下信息：

1. Cloud Run 日志（最近 50 行）
2. 浏览器 Network 标签中的错误响应
3. `/api/debug` 端点的响应
4. 当前的 Cloud Run 配置：
   ```bash
   gcloud run services describe pdf2md-test \
     --region=australia-southeast1 \
     --format=yaml
   ```
