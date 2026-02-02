#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Trap signals for graceful shutdown
trap 'print_info "Shutting down..."; kill $MARKER_PID $NEXTJS_PID 2>/dev/null; exit 0' SIGTERM SIGINT

# Print environment information
print_info "Starting PDF to Markdown Converter"
print_info "Environment:"
echo "  - PORT: ${PORT}"
echo "  - MARKER_PORT: ${MARKER_PORT}"
echo "  - TORCH_DEVICE: ${TORCH_DEVICE}"
echo "  - NODE_ENV: ${NODE_ENV}"
echo ""

# Change to marker service directory
cd /app/marker-service

# Start Marker service in background
print_info "Starting Marker service on port ${MARKER_PORT}..."
python server.py --port ${MARKER_PORT} --host 0.0.0.0 > /tmp/marker.log 2>&1 &
MARKER_PID=$!

# Wait for Marker service to start
print_info "Waiting for Marker service to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:${MARKER_PORT}/health > /dev/null 2>&1; then
        print_info "Marker service is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Marker service failed to start within ${MAX_RETRIES} retries"
    print_error "Check logs at /tmp/marker.log"
    cat /tmp/marker.log
    exit 1
fi

echo ""
print_info "Marker service is running with PID: ${MARKER_PID}"

# Change to frontend directory
cd /app/frontend

# Start Next.js application in foreground
print_info "Starting Next.js application on port ${PORT}..."
print_info "Application will be available at http://0.0.0.0:${PORT}"
echo ""

# Start Next.js
npm start &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 5

# Check if Next.js started successfully
if ! kill -0 $NEXTJS_PID 2>/dev/null; then
    print_error "Next.js failed to start"
    print_error "Check logs for details"
    exit 1
fi

print_info "Next.js is running with PID: ${NEXTJS_PID}"
print_info "All services are running successfully!"
echo ""
echo "=========================================="
echo "Services Status:"
echo "  - Marker:    http://localhost:${MARKER_PORT}"
echo "  - Next.js:    http://localhost:${PORT}"
echo "=========================================="
echo ""

# Function to monitor services
monitor_services() {
    while true; do
        sleep 10
        
        # Check Marker
        if ! kill -0 $MARKER_PID 2>/dev/null; then
            print_error "Marker service died unexpectedly!"
            kill $NEXTJS_PID 2>/dev/null
            exit 1
        fi
        
        # Check Next.js
        if ! kill -0 $NEXTJS_PID 2>/dev/null; then
            print_error "Next.js died unexpectedly!"
            kill $MARKER_PID 2>/dev/null
            exit 1
        fi
    done
}

# Start monitoring in background
monitor_services &
MONITOR_PID=$!

# Wait for either process to finish
wait $MARKER_PID $NEXTJS_PID
