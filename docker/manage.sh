#!/bin/bash
# Docker management script for Crackle

set -e

DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$DOCKER_DIR"

case "${1:-help}" in
  start)
    echo "🚀 Starting Crackle..."
    docker-compose up -d
    echo "✅ Crackle is running at http://localhost:5000"
    ;;
  stop)
    echo "🛑 Stopping Crackle..."
    docker-compose down
    echo "✅ Crackle stopped"
    ;;
  restart)
    echo "🔄 Restarting Crackle..."
    docker-compose restart
    echo "✅ Crackle restarted"
    ;;
  rebuild)
    echo "🏗️  Rebuilding Crackle..."
    docker-compose up -d --build
    echo "✅ Crackle rebuilt and running at http://localhost:5000"
    ;;
  logs)
    docker-compose logs -f crackle
    ;;
  status)
    docker-compose ps
    ;;
  health)
    echo "🏥 Checking health..."
    curl -f http://localhost:5000/api/health | jq || echo "❌ Health check failed"
    ;;
  shell)
    echo "🐚 Opening shell in container..."
    docker exec -it crackle-app /bin/sh
    ;;
  clean)
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup complete"
    ;;
  help|*)
    echo "Crackle Docker Management Script"
    echo ""
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start the application"
    echo "  stop     - Stop the application"
    echo "  restart  - Restart the application"
    echo "  rebuild  - Rebuild and start the application"
    echo "  logs     - View application logs (follow mode)"
    echo "  status   - Show container status"
    echo "  health   - Check application health"
    echo "  shell    - Open shell in container"
    echo "  clean    - Stop and remove all Docker resources"
    echo "  help     - Show this help message"
    ;;
esac
