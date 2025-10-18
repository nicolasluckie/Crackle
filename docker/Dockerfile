# Multi-stage Dockerfile for Crackle with separate frontend and backend
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/web

# Accept build arguments for analytics configuration (Rybbit)
ARG VITE_RYBBIT_SCRIPT_URL
ARG VITE_RYBBIT_SITE_ID
ARG VITE_RYBBIT_API_KEY

# Make the variables available to Vite during `npm run build`
ENV VITE_RYBBIT_SCRIPT_URL=$VITE_RYBBIT_SCRIPT_URL \
	VITE_RYBBIT_SITE_ID=$VITE_RYBBIT_SITE_ID \
	VITE_RYBBIT_API_KEY=$VITE_RYBBIT_API_KEY

# Copy frontend package files
COPY web/package*.json ./

# Install dependencies (including devDependencies for build tools like TypeScript)
RUN npm ci

# Copy frontend source code
COPY web/ ./

# Build the React application with environment variables
RUN npm run build

# Stage 2: Backend service (Flask API)
FROM python:3.11-slim AS backend

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy Python application files
COPY crackle.py ./
COPY api.py ./
COPY wordle_answers.txt ./

# Expose the Flask API port (internal only)
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=api.py
ENV PYTHONUNBUFFERED=1

# Use gunicorn for production
# Note: Using 1 worker with 4 threads - threads share memory for game state
# This allows concurrent requests while keeping in-memory state working
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "4", "--timeout", "60", "api:app"]

# Stage 3: Frontend service (nginx)
FROM nginx:alpine AS frontend

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from the builder stage
COPY --from=frontend-builder /app/web/dist /usr/share/nginx/html

# Expose nginx port
EXPOSE 80

# nginx will start automatically with the default CMD
