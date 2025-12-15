#!/bin/bash

set -e

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
docker-compose -f docker-compose.prod.yml restart nginx

echo "✅ Done!"

