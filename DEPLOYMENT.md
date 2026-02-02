# Deployment Guide

This guide covers deploying the PDF to Markdown Converter to Google Cloud Run.

## Prerequisites

1. **Google Cloud Project**
   - Create a GCP project at https://console.cloud.google.com
   - Enable required APIs:
     ```bash
     gcloud services enable \
       cloudbuild.googleapis.com \
       run.googleapis.com \
       artifactregistry.googleapis.com \
       containerregistry.googleapis.com
     ```

2. **Google Cloud SDK**
   - Install gcloud CLI: https://cloud.google.com/sdk/docs/install
   - Authenticate:
     ```bash
     gcloud auth login
     ```

3. **Docker**
   - Install Docker: https://docs.docker.com/get-docker/

## Setting Up Workload Identity Federation

Workload Identity Federation allows GitHub Actions to authenticate with GCP without storing credentials.

### 1. Create Service Account

```bash
# Replace with your project ID
PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project=$PROJECT_ID

# Get the service account email
SERVICE_ACCOUNT="github-actions@$PROJECT_ID.iam.gserviceaccount.com"
```

### 2. Grant Permissions

```bash
# Grant Cloud Run Developer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.developer" \
  --project=$PROJECT_ID

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountUser" \
  --project=$PROJECT_ID
```

### 3. Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create github-pool \
  --project=$PROJECT_ID \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 4. Create Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create github-provider \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
```

### 5. Grant Workload Identity User Role

```bash
# Replace with your GitHub username and repo name
GITHUB_USERNAME="your-username"
GITHUB_REPO="your-repo-name"

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_ID/locations/global/workloadIdentityPools/github-pool/repo/$GITHUB_USERNAME/$GITHUB_REPO_NAME"
```

## Configure GitHub Secrets

Navigate to your GitHub repository: **Settings** > **Secrets and variables** > **Actions**

Add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|----------|
| `GCP_PROJECT_ID` | Your GCP project ID | `my-project-12345` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider path | `projects/my-project-12345/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | Service account email | `github-actions@my-project-12345.iam.gserviceaccount.com` |

### Getting the Workload Identity Provider

After creating the provider, run:

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(fullName)"
```

This will output the full path needed for the `GCP_WORKLOAD_IDENTITY_PROVIDER` secret.

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

1. Push code to main branch:
   ```bash
   git add .
   git commit -m "feat: initial deployment"
   git push origin main
   ```

2. Monitor deployment:
   - Go to GitHub > Actions tab
   - Watch the workflow progress
   - Service URL will be shown in workflow logs

3. Manual trigger:
   - Go to Actions tab
   - Select "Build and Deploy to Cloud Run"
   - Click "Run workflow"
   - Select environment (production/staging)

### Method 2: Manual Deployment

#### Build and Push Image

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export IMAGE_NAME="gcr.io/$PROJECT_ID/pdf-to-markdown"

# Build image
docker build -t $IMAGE_NAME:latest .

# Authenticate with gcloud
gcloud auth configure-docker

# Push image
docker push $IMAGE_NAME:latest
```

#### Deploy to Cloud Run

```bash
# CPU version (default)
gcloud run deploy pdf-to-markdown \
  --image=$IMAGE_NAME:latest \
  --region=us-central1 \
  --platform=managed \
  --port=3000 \
  --memory=4Gi \
  --cpu=2 \
  --timeout=3600 \
  --max-instances=10 \
  --min-instances=0 \
  --allow-unauthenticated \
  --set-env-vars=TORCH_DEVICE=cpu,MARKER_PORT=8001

# GPU version (optional, for faster processing)
gcloud run deploy pdf-to-markdown-gpu \
  --image=$IMAGE_NAME:latest \
  --region=us-central1 \
  --platform=managed \
  --accelerator type=nvidia-l4,count=1 \
  --memory=16Gi \
  --cpu=8 \
  --timeout=3600 \
  --max-instances=5 \
  --min-instances=0 \
  --allow-unauthenticated \
  --set-env-vars=TORCH_DEVICE=cuda,MARKER_PORT=8001
```

### Method 3: Docker Compose (Local Testing)

```bash
# Build and run locally
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration Options

### Memory and CPU

| Instance Type | Memory | CPU | Use Case |
|-------------|---------|------|-----------|
| Default | 4Gi | 2 vCPU | Standard usage |
| Large | 8Gi | 4 vCPU | Large PDFs |
| GPU | 16Gi | 8 vCPU | High volume, GPU acceleration |

### Scaling

```yaml
# Minimum instances (for fast response)
--min-instances=1

# Maximum instances (to limit costs)
--max-instances=10

# Auto-scaling (default)
--min-instances=0
--max-instances=10
```

### GPU Support

GPU is available in these regions:
- `us-central1` (Iowa)
- `us-east1` (South Carolina)
- `europe-west4` (Netherlands)
- `asia-southeast1` (Singapore)

Available GPU types:
- `nvidia-l4` - Best balance of performance and cost
- `nvidia-t4` - Cost-effective option

## Cost Estimation

### CPU Instance

- Memory: 4Gi × $0.00000025/GB second
- CPU: 2 vCPU × $0.000004/vCPU second
- Estimated cost: ~$0.01-0.05 per conversion

**Monthly estimate** (100 conversions/day): ~$30-150/month

### GPU Instance

- Base + NVIDIA L4 GPU: ~$0.74/hour
- Memory: 16Gi, CPU: 8 vCPU
- Estimated cost: ~$535/month (if running 24/7)

**Monthly estimate** (100 conversions/day): ~$600-800/month (with idle time)

## Monitoring and Logging

### View Logs

```bash
# Stream logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=pdf-to-markdown"

# View recent logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Export logs
gcloud logging read "resource.type=cloud_run_revision" > logs.json
```

### Monitor Metrics

```bash
# Create alert policy
gcloud monitoring policies create \
  --policy-from-file=alert-policy.yaml

# List existing policies
gcloud monitoring policies list
```

### Service Status

```bash
# Get service details
gcloud run services describe pdf-to-markdown --region=us-central1

# List revisions
gcloud run revisions list --service=pdf-to-markdown --region=us-central1

# Get traffic distribution
gcloud run services get-traffic pdf-to-markdown --region=us-central1
```

## Troubleshooting

### Deployment Fails

1. Check permissions:
   ```bash
   gcloud iam service-accounts get-iam-policy github-actions@$PROJECT_ID.iam.gserviceaccount.com
   ```

2. Verify Workload Identity:
   ```bash
   gcloud iam workload-identity-pools list
   gcloud iam workload-identity-pools providers list
   ```

3. Check GitHub Actions secrets:
   - Go to Settings > Secrets
   - Verify all 3 secrets are set correctly

### Service Not Responding

1. Check health endpoint:
   ```bash
   curl https://YOUR_SERVICE_URL/api/health
   ```

2. View logs:
   ```bash
   gcloud logging tail "resource.type=cloud_run_revision"
   ```

3. Check if pods are running:
   ```bash
   gcloud run services describe pdf-to-markdown
   ```

### Cold Start Delays

If the service takes too long to respond:

1. Increase minimum instances:
   ```bash
   gcloud run services update pdf-to-markdown \
     --region=us-central1 \
     --min-instances=1
   ```

2. Use startup probe (already configured in Dockerfile)

3. Consider using GPU for faster startup

## Rollback

If a deployment introduces issues:

```bash
# List revisions
gcloud run revisions list --service=pdf-to-markdown --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic pdf-to-markdown \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

## Security Best Practices

1. **Don't commit secrets**
   - Use GitHub Secrets
   - Never push `.env` files

2. **Limit access**
   - Use IAM roles instead of owners
   - Regularly audit permissions

3. **Monitor costs**
   - Set budget alerts
   - Review usage monthly
   - Optimize instance settings

4. **Keep updated**
   - Update dependencies regularly
   - Apply security patches
   - Monitor for vulnerabilities

## Support

For deployment issues:
- Check GCP documentation: https://cloud.google.com/run/docs
- GitHub Issues: Open an issue in the repository
- Cloud Support: GCP Console > Support
