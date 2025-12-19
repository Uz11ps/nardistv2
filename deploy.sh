#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Build frontend
echo "📦 Building frontend..."
npm install
npm run build

# Install PHP dependencies
echo "📦 Installing PHP dependencies..."
docker-compose exec php composer install --no-dev --optimize-autoloader

# Generate app key if not exists
echo "🔑 Generating application key..."
docker-compose exec php php artisan key:generate --force || true

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose exec php php artisan migrate --force

echo "✅ Deployment completed!"

