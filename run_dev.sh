#!/bin/bash
echo "Starting Creative.hack Platform Development Servers"

read -p "Initialize database? (y/n): " init_db
if [ "$init_db" = "y" ] || [ "$init_db" = "Y" ]; then
    echo "Initializing database..."
    cd backend && python init_db.py
    cd ..
fi

read -p "Startup database? (y/n): " start_db
if [ "$start_db" = "y" ] || [ "$start_db" = "Y" ]; then
	echo "Startup database..."
	sudo service postgresql start
fi

echo "Starting Backend Server..."
source creative_hack/bin/activate
cd backend && nohup python run_server.py &
cd ..

echo "Starting Frontend Server..."
cd frontend && nohup npm run dev &

echo "Development servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Documentation: http://localhost:8000/docs"
