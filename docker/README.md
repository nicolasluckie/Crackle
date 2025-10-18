# Docker Deployment for Crackle

This directory contains the Docker configuration files for deploying Crackle in production with proper security isolation.

## 📋 Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

## 🏗️ Architecture

### Security-First Design

The deployment uses a **two-container architecture** with internal network isolation:

1. **Backend Container** (`crackle-backend`)
   - Runs Flask API with Gunicorn
   - **NOT exposed to the host** - only accessible within Docker network
   - Port 5000 is internal only

2. **Frontend Container** (`crackle-frontend`)
   - Runs nginx serving static React files
   - **Only container exposed to host** on port 8080
   - Proxies `/api/*` requests to backend container internally
   - Includes security headers

### Multi-Stage Build

The Dockerfile uses multi-stage builds with separate targets:

1. **Stage 1: Frontend Builder** (`node:18-alpine`)
   - Builds React application with Vite
   - Outputs static files to `web/dist`

2. **Stage 2: Backend** (`python:3.11-slim`)
   - Runs Flask API with Gunicorn (internal only)

3. **Stage 3: Frontend** (`nginx:alpine`)
   - Serves static files and proxies API requests

## 🚀 Quick Start

### 1. Configure Environment Variables

Copy the production template and configure for your domain:

```bash
cd docker
cp .env.production .env
```

Edit `.env` and configure:
```env
# Required: Set your domain for CORS
ALLOWED_ORIGINS=https://example.domain.com

# Optional: Configure analytics (leave empty to disable)
# Rybbit tracking script URL, site ID, and optional dev API key
VITE_RYBBIT_SCRIPT_URL=https://rybbit.example.com/api/script.js
VITE_RYBBIT_SITE_ID=your-site-id
# Only for localhost tracking during development; DO NOT use in production
VITE_RYBBIT_API_KEY=rb_your_local_dev_api_key
```

**Note:** If you don't want analytics, simply leave `VITE_RYBBIT_SCRIPT_URL` and `VITE_RYBBIT_SITE_ID` empty or comment them out.

### 2. Create Docker Network

Create the external network for Cloudflare tunnel connection:

```bash
docker network create cloudflare_network
```

**Note:** This step is only needed once. The network persists across container restarts.

### 3. Build and Run

From the **docker directory**, run:

```bash
docker-compose up -d
```

This will:
1. Build both frontend and backend containers
2. Start services with internal networking
3. Connect frontend to both `crackle-internal` and `cloudflare_network`
4. Expose only nginx on `http://localhost:8080`

### 4. Configure Cloudflare Zero Trust Tunnel

**Option A: Using Docker Network (Recommended)**

In the Cloudflare Web UI, set the Service URL to:
```
http://crackle:80
```

The frontend container has the alias `crackle` on the `cloudflare_network`, allowing cloudflared to connect directly via Docker networking.

**Option B: Using Localhost**

Alternatively, configure your Cloudflare tunnel to point to:
```
http://localhost:8080
```

This method is simpler if cloudflared runs as a system service on the host.

The tunnel will handle SSL termination, and nginx will serve the application.

## 🛠️ Docker Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs (both containers)
```bash
docker-compose logs -f
```

### View specific container logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild the application
```bash
docker-compose up -d --build
```

### Check application status
```bash
docker-compose ps
```

## � Access Points

### Local Development/Testing
- **Web UI**: `http://localhost:8080`
- **API Health Check**: `http://localhost:8080/api/health` (proxied through nginx)

### Production (via Cloudflare Tunnel)
- **Web UI**: `https://example.domain.com`
- **Backend API**: Not directly accessible (internal only)

**Security Note**: The backend Flask API is NEVER exposed externally. All API requests from the browser go through nginx, which proxies them to the internal backend container.

## 🔍 Health Checks

Both containers include health checks:

### Frontend Health Check
```bash
curl http://localhost:8080/health
```

Expected response: `healthy`

### Backend Health Check (via proxy)
```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "ok",
  "words_loaded": 14855
}
```

### Docker Health Status
```bash
docker inspect --format='{{json .State.Health}}' crackle-backend | jq
docker inspect --format='{{json .State.Health}}' crackle-frontend | jq
```

## 🐛 Troubleshooting

### View Application Logs
```bash
# All containers
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Access Container Shell
```bash
# Backend
docker exec -it crackle-backend /bin/sh

# Frontend
docker exec -it crackle-frontend /bin/sh
```

### Check Health Status
```bash
# Via frontend nginx
curl http://localhost:8080/api/health

# Direct to frontend
curl http://localhost:8080/health
```

### Test Backend Isolation
```bash
# This should FAIL (connection refused) - backend is not exposed:
curl http://localhost:5000/api/health

# This should SUCCEED - proxied through nginx:
curl http://localhost:8080/api/health
```

### Rebuild from Scratch
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Network Configuration
```bash
docker network inspect docker_crackle-internal
```

## 📦 Production Deployment

### Environment Variables

**CRITICAL**: You must configure `.env` before deploying to production.

Create `.env` from the template:
```bash
cp .env.production .env
```

Required configuration:
```env
# Flask Configuration
FLASK_ENV=production
FLASK_APP=api.py
PYTHONUNBUFFERED=1

# CORS Configuration - MUST MATCH YOUR DOMAIN
ALLOWED_ORIGINS=https://example.domain.com

# Gunicorn Configuration
WORKERS=4
TIMEOUT=60
```

**Security Note**: The `ALLOWED_ORIGINS` setting is CRITICAL. The Flask backend will reject any requests that don't come from this origin, preventing unauthorized API access.

### Cloudflare Zero Trust Tunnel Setup

On your Debian deployment machine:

1. Install Cloudflare tunnel: `https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/`
2. Configure tunnel to point to `http://localhost:8080`
3. The tunnel provides:
   - SSL/TLS termination
   - DDoS protection
   - Zero Trust access controls
4. Your domain `example.domain.com` will be served over HTTPS

### Resource Limits

To limit CPU and memory usage, add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

### Port Configuration

**Do not change** the port configuration in production unless you understand the security implications:

- Frontend (nginx): Port 8080 on host → Port 80 in container
- Backend (Flask): NO host port → Port 5000 internal only

To change the external port (e.g., to 80), edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "80:80"  # Requires sudo/root
```

## 🔒 Security Features

### Network Isolation
- **Backend API is NOT exposed** to the host or external network
- Only nginx frontend container has an exposed port (8080)
- Backend accessible only via Docker internal network
- API requests are proxied through nginx

### CORS Protection
- Flask backend configured with strict CORS policy
- Only accepts requests from configured `ALLOWED_ORIGINS`
- Must match your production domain exactly
- Prevents unauthorized API access from other domains

### Security Headers
Nginx includes security headers:
- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control

### Best Practices
1. **Never expose backend port** - Keep Flask API internal only
2. **Set correct CORS origin** - Match your domain exactly
3. **Use Cloudflare tunnel** - Provides SSL, DDoS protection, access controls
4. **Keep .env secure** - Don't commit to version control
5. **Regular updates** - Update Docker images and dependencies
6. **Monitor logs** - Watch for unauthorized access attempts

### Testing Security

Verify backend is not externally accessible:
```bash
# Should FAIL (connection refused)
curl http://localhost:5000/api/health

# Should SUCCEED (proxied through nginx)
curl http://localhost:8080/api/health
```

Verify CORS (from browser console on different domain):
```javascript
// Should fail with CORS error if domain doesn't match ALLOWED_ORIGINS
fetch('http://localhost:8080/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

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
