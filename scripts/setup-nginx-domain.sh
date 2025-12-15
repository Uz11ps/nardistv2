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

if [ -z "$1" ]; then
    echo "Usage: ./scripts/setup-nginx-domain.sh <your-domain.com>"
    exit 1
fi

DOMAIN=$1

echo "🔧 Setting up Nginx configuration for domain: ${DOMAIN}"

# Create nginx config with domain
sed "s/\${DOMAIN_NAME}/${DOMAIN}/g" nginx/conf.d/default.conf.template > nginx/conf.d/default.conf

echo "✅ Nginx configuration updated!"
echo "🔄 Restarting Nginx..."
$DOCKER_COMPOSE -f docker-compose.prod.yml restart nginx

echo "✅ Done!"

