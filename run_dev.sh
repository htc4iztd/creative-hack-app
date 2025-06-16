#!/bin/bash
echo "Starting Creative.hack Platform Development Servers"

read -p "Initialize database? (y/n): " init_db
if [ "$init_db" = "y" ] || [ "$init_db" = "Y" ]; then
    echo "Initializing database..."
    cd backend && python init_db.py
    cd ..
fi

echo "Starting Backend Server..."
cd backend && python run_server.py &
cd ..

echo "Starting Frontend Server..."
cd frontend && npm run dev &

echo "Development servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Documentation: http://localhost:8000/docs"
