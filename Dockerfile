# Stage 1: Python base image + Marker
FROM python:3.10-slim AS python-base

# Set working directory
WORKDIR /app/marker-service

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY marker-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Marker models (to avoid downloading on first startup)
RUN python -c "from marker.models import create_model_dict; create_model_dict()"

# Copy marker service files
COPY marker-service/server.py .
COPY marker-service/health.py .

# Create uploads directory
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads

# Stage 2: Node.js base image + Next.js
FROM node:18-alpine AS node-base

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY frontend/ .

# Set environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN npm run build

# Remove node_modules for production (not needed for running)
RUN npm ci --only=production --ignore-scripts

# Stage 3: Final runtime image
FROM python:3.10-slim

# Install system dependencies including Node.js runtime
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python packages and marker service from python-base
COPY --from=python-base /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=python-base /app/marker-service ./marker-service
COPY --from=python-base /tmp/uploads /tmp/uploads

# Copy Next.js build from node-base
COPY --from=node-base /app/frontend ./frontend
COPY --from=node-base /app/frontend/node_modules ./frontend/node_modules

# Create uploads directory
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=3000
ENV MARKER_PORT=8001
ENV TORCH_DEVICE=cpu
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy startup script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Expose ports
EXPOSE 3000 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Set working directory
WORKDIR /app/frontend

# Use startup script as entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command (if needed)
CMD ["npm", "start"]
