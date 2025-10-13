# Docker Deployment for Crackle

This directory contains the Docker configuration files for deploying Crackle in production.

## 📋 Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

## 🚀 Quick Start

### Build and Run

From the **project root directory**, run:

```bash
cd docker
docker-compose up -d
```

This will:
1. Build the React frontend
2. Build the Flask backend
3. Start the Crackle application on `http://localhost:5000`

### Access the Application

Open your browser and navigate to:
- **Web UI**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

## 🛠️ Docker Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f crackle
```

### Rebuild the application
```bash
docker-compose up -d --build
```

### Check application status
```bash
docker-compose ps
```

## 🏗️ Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **Stage 1: Frontend Builder** (`node:18-alpine`)
   - Installs Node.js dependencies
   - Builds the React application with Vite
   - Outputs static files to `web/dist`

2. **Stage 2: Production Server** (`python:3.11-slim`)
   - Installs Python dependencies
   - Copies backend files (`crackle.py`, `api.py`, `wordle_answers.txt`)
   - Copies built frontend from Stage 1
   - Serves both API and static frontend using Gunicorn

### Port Configuration

- **Container Port**: 5000
- **Host Port**: 5000 (configurable in `docker-compose.yml`)

To change the host port, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:5000"  # Maps host port 8080 to container port 5000
```

## 🔍 Health Checks

The application includes a health check endpoint that Docker uses to monitor the service:

- **Endpoint**: `/api/health`
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts before marking unhealthy
- **Start Period**: 40 seconds (grace period on startup)

Check health status:
```bash
docker inspect --format='{{json .State.Health}}' crackle-app | jq
```

## 🐛 Troubleshooting

### View Application Logs
```bash
docker-compose logs -f crackle
```

### Access Container Shell
```bash
docker exec -it crackle-app /bin/sh
```

### Check Health Status
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "words_loaded": 14855
}
```

### Rebuild from Scratch
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📦 Production Deployment

### Environment Variables

You can customize the application by adding environment variables in `docker-compose.yml`:

```yaml
environment:
  - FLASK_ENV=production
  - PYTHONUNBUFFERED=1
  - WORKERS=4  # Number of Gunicorn workers
```

### Resource Limits

To limit CPU and memory usage, add resource constraints:

```yaml
services:
  crackle:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Reverse Proxy (Nginx/Caddy)

For production, it's recommended to use a reverse proxy:

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name crackle.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔒 Security Considerations

1. **Production Secrets**: Don't commit sensitive data to version control
2. **CORS Configuration**: Restrict CORS origins in production
3. **HTTPS**: Use a reverse proxy with SSL/TLS certificates
4. **Rate Limiting**: Consider adding rate limiting for API endpoints
5. **Updates**: Regularly update base images and dependencies

## 📝 Notes

- The application runs with **Gunicorn** (4 workers by default)
- Static frontend files are served directly by Flask
- The word list (`wordle_answers.txt`) is bundled in the container
- No persistent storage is required (application is stateless)
- In-memory game state is lost on container restart

## 🤝 Contributing

When making changes to the Docker setup:

1. Test locally: `docker-compose up --build`
2. Verify health check: `curl http://localhost:5000/api/health`
3. Check logs for errors: `docker-compose logs`
4. Update this README if configuration changes

## 📄 License

Same as the main project - MIT License
