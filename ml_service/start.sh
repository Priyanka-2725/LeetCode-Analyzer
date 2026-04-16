#!/usr/bin/env bash
# Start the ML prediction microservice
set -e

PORT=${PORT:-8000}

echo "Starting LeetCode ML Prediction Service on port $PORT..."
uvicorn main:app --host 0.0.0.0 --port "$PORT" --reload
