#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Check if domain is set
if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Error: DOMAIN_NAME not set in .env file!"
    exit 1
fi

echo "📦 Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull

echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "🔒 Setting up SSL certificate..."
if [ ! -f "./nginx/ssl/live/${DOMAIN_NAME}/fullchain.pem" ]; then
    echo "📝 Requesting SSL certificate..."
    docker-compose -f docker-compose.prod.yml run --rm certbot
    echo "🔄 Reloading Nginx..."
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
else
    echo "✅ SSL certificate already exists"
fi

echo "🧹 Cleaning up..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is available at: https://${DOMAIN_NAME}"

