#!/bin/bash

set -e

echo "📦 Generating package-lock.json files..."

# Генерируем package-lock.json для backend
if [ -d "backend" ]; then
    echo "📦 Generating backend/package-lock.json..."
    cd backend
    # Обновляем package-lock.json если он устарел
    echo "🔄 Updating backend/package-lock.json..."
    npm install --package-lock-only --legacy-peer-deps --no-audit
    echo "✅ Updated backend/package-lock.json"
    cd ..
fi

# Генерируем package-lock.json для frontend
if [ -d "frontend" ]; then
    echo "📦 Generating frontend/package-lock.json..."
    cd frontend
    # Обновляем package-lock.json если он устарел
    echo "🔄 Updating frontend/package-lock.json..."
    npm install --package-lock-only --no-audit
    echo "✅ Updated frontend/package-lock.json"
    cd ..
fi

echo "✅ Package lock files generation completed!"

