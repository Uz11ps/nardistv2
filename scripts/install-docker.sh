#!/bin/bash

set -e

echo "🐳 Installing Docker..."

# Проверяем, установлен ли Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker is already installed"
    docker --version
    exit 0
fi

# Проверяем, запущен ли скрипт от root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "📦 Installing Docker from official script..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Добавляем пользователя в группу docker
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
    echo "✅ Added $SUDO_USER to docker group"
elif [ -n "$USER" ] && [ "$USER" != "root" ]; then
    usermod -aG docker "$USER"
    echo "✅ Added $USER to docker group"
else
    echo "⚠️  Could not determine user. Please add manually:"
    echo "   sudo usermod -aG docker \$USER"
fi

echo "✅ Docker installed successfully!"
echo "⚠️  You may need to log out and log back in for group changes to take effect"
echo "⚠️  Or run: newgrp docker"

# Проверяем установку
docker --version

