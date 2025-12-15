#!/bin/bash

# Prune Docker system
echo "Pruning Docker system..."
docker system prune -f

# Build and run main-app
echo "Building and starting main-app..."
docker build -t cognito-ad-demo ./main-app
docker run -d -p 3000:3000 --name cognito-ad-demo cognito-ad-demo

echo "Main-app container started successfully!"