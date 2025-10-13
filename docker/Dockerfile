# Multi-stage Dockerfile for Crackle
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/web

# Copy frontend package files
COPY web/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY web/ ./

# Build the React application
RUN npm run build

# Stage 2: Setup Python backend and serve the application
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy Python application files
COPY crackle.py ./
COPY api.py ./
COPY wordle_answers.txt ./

# Copy built frontend from the first stage
COPY --from=frontend-builder /app/web/dist ./web/dist

# Expose the Flask API port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=api.py
ENV PYTHONUNBUFFERED=1

# Use gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "60", "api:app"]
