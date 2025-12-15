#!/bin/bash

set -e

echo "📦 Generating package-lock.json files..."

# Генерируем package-lock.json для backend
if [ -d "backend" ]; then
    echo "📦 Generating backend/package-lock.json..."
    cd backend
    if [ ! -f "package-lock.json" ]; then
        npm install --package-lock-only --legacy-peer-deps
        echo "✅ Created backend/package-lock.json"
    else
        echo "✅ backend/package-lock.json already exists"
    fi
    cd ..
fi

# Генерируем package-lock.json для frontend
if [ -d "frontend" ]; then
    echo "📦 Generating frontend/package-lock.json..."
    cd frontend
    if [ ! -f "package-lock.json" ]; then
        npm install --package-lock-only
        echo "✅ Created frontend/package-lock.json"
    else
        echo "✅ frontend/package-lock.json already exists"
    fi
    cd ..
fi

echo "✅ Package lock files generation completed!"

