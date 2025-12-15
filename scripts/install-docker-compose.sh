#!/bin/bash

set -e

echo "🐳 Installing Docker Compose..."

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "Please install Docker first: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Проверяем версию Docker
DOCKER_VERSION=$(docker --version)
echo "✅ Found: $DOCKER_VERSION"

# Проверяем, есть ли уже docker compose (новая версия)
if docker compose version &> /dev/null; then
    echo "✅ Docker Compose (plugin) is already installed!"
    docker compose version
    exit 0
fi

# Проверяем, есть ли docker-compose (старая версия)
if command -v docker-compose &> /dev/null; then
    echo "✅ docker-compose is already installed!"
    docker-compose --version
    exit 0
fi

# Устанавливаем Docker Compose plugin (рекомендуемый способ)
echo "📦 Installing Docker Compose plugin..."

# Для новых версий Docker Compose встроен в Docker
# Но если его нет, устанавливаем как плагин
if [ -d "/usr/libexec/docker/cli-plugins" ]; then
    mkdir -p /usr/libexec/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/libexec/docker/cli-plugins/docker-compose
    chmod +x /usr/libexec/docker/cli-plugins/docker-compose
    echo "✅ Docker Compose plugin installed!"
    docker compose version
else
    # Устанавливаем как отдельную команду (старый способ)
    echo "📦 Installing docker-compose as standalone command..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ docker-compose installed!"
    docker-compose --version
fi

echo "✅ Docker Compose installation completed!"

