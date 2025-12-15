#!/bin/bash

set -e

# Определяем команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    exit 1
fi

echo "🔄 Renewing SSL certificates..."

$DOCKER_COMPOSE -f docker-compose.prod.yml run --rm certbot renew

echo "🔄 Reloading Nginx..."
$DOCKER_COMPOSE -f docker-compose.prod.yml exec nginx nginx -s reload

echo "✅ SSL certificates renewed successfully!"

