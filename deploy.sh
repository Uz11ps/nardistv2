#!/bin/bash

set -e

# Определяем команду docker compose (новая версия) или docker-compose (старая версия)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "🚀 Starting deployment..."
echo "📝 Using: $DOCKER_COMPOSE"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

# Check if domain is set
if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Error: DOMAIN_NAME not set in .env file!"
    exit 1
fi

echo "📦 Pulling latest images..."
$DOCKER_COMPOSE -f docker-compose.prod.yml pull

echo "🔨 Building and starting containers..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🗄️ Running database migrations..."
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "🔒 Setting up SSL certificate..."
if [ ! -d "./nginx/ssl/live/${DOMAIN_NAME}" ] || [ ! -f "./nginx/ssl/live/${DOMAIN_NAME}/fullchain.pem" ]; then
    echo "📝 Requesting SSL certificate..."
    echo "⚠️  Note: SSL certificate setup requires the domain to point to this server"
    echo "⚠️  Make sure DNS is configured before running this step"
    $DOCKER_COMPOSE -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email ${SSL_EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN_NAME} \
        -d www.${DOMAIN_NAME} || echo "⚠️  SSL certificate request failed. You can set it up later."
    echo "🔄 Reloading Nginx..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || echo "⚠️  Nginx reload skipped (may not be running yet)"
else
    echo "✅ SSL certificate already exists"
fi

echo "🧹 Cleaning up..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is available at: https://${DOMAIN_NAME}"

