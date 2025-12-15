#!/bin/bash

# Build and run Docker container for React app only
docker build -t cognito-demo .
docker run -d -p 3000:80 --name cognito-demo-app cognito-demo

echo "App running at http://localhost:3000"