#!/bin/bash

set -e

echo "🔧 Generating .env file for production..."

# Генерируем безопасные пароли
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)

# Проверяем, существует ли .env
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Cancelled"
        echo "💡 Tip: You can manually edit .env file with: nano .env"
        exit 1
    fi
fi

# Создаем .env файл
cat > .env << EOF
# Database
POSTGRES_USER=nardist
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=nardist_db

# Backend
JWT_SECRET=${JWT_SECRET}
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
NODE_ENV=production
PORT=3000

# Frontend
VITE_API_URL=https://nardist.online
VITE_WS_URL=https://nardist.online
FRONTEND_URL=https://nardist.online

# Domain
DOMAIN_NAME=nardist.online
SSL_EMAIL=your-email@example.com

# Docker Images (optional - for GitHub Container Registry)
# BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest
# FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📝 IMPORTANT: Please edit .env file and fill in:"
echo "   1. TELEGRAM_BOT_TOKEN - your Telegram bot token"
echo "   2. SSL_EMAIL - your email for SSL certificate"
echo ""
echo "Generated secure values:"
echo "   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}"
echo "   JWT_SECRET: ${JWT_SECRET}"
echo ""
read -p "Do you want to edit .env file now? (yes/no): " edit
if [ "$edit" == "yes" ]; then
    nano .env
fi

