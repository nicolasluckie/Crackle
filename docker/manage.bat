@echo off
REM Docker management script for Crackle (Windows)

cd /d "%~dp0"

if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="rebuild" goto rebuild
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="health" goto health
if "%1"=="shell" goto shell
if "%1"=="clean" goto clean
if "%1"=="help" goto help
goto help

:start
echo 🚀 Starting Crackle...
docker-compose up -d
echo ✅ Crackle is running at http://localhost:5000
goto :eof

:stop
echo 🛑 Stopping Crackle...
docker-compose down
echo ✅ Crackle stopped
goto :eof

:restart
echo 🔄 Restarting Crackle...
docker-compose restart
echo ✅ Crackle restarted
goto :eof

:rebuild
echo 🏗️  Rebuilding Crackle...
docker-compose up -d --build
echo ✅ Crackle rebuilt and running at http://localhost:5000
goto :eof

:logs
docker-compose logs -f crackle
goto :eof

:status
docker-compose ps
goto :eof

:health
echo 🏥 Checking health...
curl -f http://localhost:5000/api/health
goto :eof

:shell
echo 🐚 Opening shell in container...
docker exec -it crackle-app /bin/sh
goto :eof

:clean
echo 🧹 Cleaning up Docker resources...
docker-compose down -v
docker system prune -f
echo ✅ Cleanup complete
goto :eof

:help
echo Crackle Docker Management Script
echo.
echo Usage: manage.bat [command]
echo.
echo Commands:
echo   start    - Start the application
echo   stop     - Stop the application
echo   restart  - Restart the application
echo   rebuild  - Rebuild and start the application
echo   logs     - View application logs (follow mode)
echo   status   - Show container status
echo   health   - Check application health
echo   shell    - Open shell in container
echo   clean    - Stop and remove all Docker resources
echo   help     - Show this help message
goto :eof
