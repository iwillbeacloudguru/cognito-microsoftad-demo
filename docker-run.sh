#!/bin/bash

# Prune Docker system
echo "Pruning Docker system..."
docker system prune -f

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose down

# Build and run all applications
echo "Building and starting all applications..."
docker-compose up --build -d

echo "Applications started successfully!"
echo "Main App: http://localhost:3000"
echo "HR App: http://localhost:3001"
echo "Finance App: http://localhost:3002"