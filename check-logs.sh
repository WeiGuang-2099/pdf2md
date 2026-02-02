#!/bin/bash
# Script to check Cloud Run logs for the pdf2md-test service

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Checking Cloud Run logs...${NC}"
echo ""

# Get logs from the last 1 hour
echo -e "${YELLOW}Recent logs:${NC}"
gcloud run services logs read pdf2md-test \
  --region=australia-southeast1 \
  --limit=50 \
  --format="table(timestamp,severity,textPayload)"

echo ""
echo -e "${YELLOW}Filtering for ERROR logs:${NC}"
gcloud run services logs read pdf2md-test \
  --region=australia-southeast1 \
  --limit=100 \
  --format="table(timestamp,severity,textPayload)" \
  | grep -i "error\|failed\|exception"

echo ""
echo -e "${YELLOW}Checking Marker service health:${NC}"
curl -v https://pdf2md-test-259381363877.australia-southeast1.run.app/api/health
