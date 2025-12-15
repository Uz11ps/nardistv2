#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/setup-ssl.sh <your-domain.com> <your-email@example.com>"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@${DOMAIN}}

echo "🔒 Setting up SSL certificate for ${DOMAIN}..."

# Create nginx config with domain
sed "s/\${DOMAIN_NAME}/${DOMAIN}/g" nginx/conf.d/default.conf.template > nginx/conf.d/default.conf

# Request certificate
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN} \
    -d www.${DOMAIN}

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "✅ SSL certificate setup completed!"

