@echo off
chcp 65001 > nul
echo Starting Creative.hack Platform Development Servers

set /p init_db="Initialize database? (y/n): "
if /i "%init_db%"=="y" (
    echo Initializing database...
    cd backend && python init_db.py
    cd ..
)

echo Starting Backend Server...
start cmd /k "cd backend && python run_server.py"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo Development servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Documentation: http://localhost:8000/docs
