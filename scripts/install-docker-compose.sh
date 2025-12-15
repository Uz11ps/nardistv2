#!/bin/bash

set -e

echo "🐳 Installing Docker Compose..."

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "📦 Installing Docker first..."
    
    # Устанавливаем Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Добавляем текущего пользователя в группу docker
    if [ "$EUID" -eq 0 ]; then
        usermod -aG docker $SUDO_USER || usermod -aG docker $(logname) || echo "⚠️  Could not add user to docker group. You may need to run: sudo usermod -aG docker $USER"
    else
        echo "⚠️  Please run as root or use sudo to add user to docker group"
    fi
    
    echo "✅ Docker installed!"
    echo "⚠️  You may need to log out and log back in for docker group changes to take effect"
    echo "⚠️  Or run: newgrp docker"
fi

# Проверяем версию Docker
DOCKER_VERSION=$(docker --version 2>/dev/null || echo "Docker not accessible")
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
echo "📦 Installing Docker Compose..."

# Пробуем установить как плагин Docker (рекомендуется)
PLUGIN_DIR="/usr/libexec/docker/cli-plugins"
if [ ! -d "$PLUGIN_DIR" ]; then
    mkdir -p "$PLUGIN_DIR"
fi

echo "📥 Downloading Docker Compose plugin..."
COMPOSE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)"
TEMP_FILE=$(mktemp)

# Пробуем скачать с проверкой
if curl -fsSL "$COMPOSE_URL" -o "$TEMP_FILE" && [ -s "$TEMP_FILE" ] && ! grep -q "<html>" "$TEMP_FILE"; then
    mv "$TEMP_FILE" "$PLUGIN_DIR/docker-compose"
    chmod +x "$PLUGIN_DIR/docker-compose"
    echo "✅ Docker Compose plugin installed!"
    docker compose version || echo "⚠️  Plugin installed but may need Docker restart"
else
    rm -f "$TEMP_FILE"
    echo "⚠️  Failed to download plugin, trying standalone version..."
    
    # Устанавливаем как отдельную команду (старый способ)
    STANDALONE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)"
    if curl -fsSL "$STANDALONE_URL" -o "$TEMP_FILE" && [ -s "$TEMP_FILE" ] && ! grep -q "<html>" "$TEMP_FILE"; then
        mv "$TEMP_FILE" /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        echo "✅ docker-compose installed!"
        docker-compose --version
    else
        rm -f "$TEMP_FILE"
        echo "❌ Failed to download Docker Compose"
        echo "Please try manually:"
        echo "  curl -L \"$STANDALONE_URL\" -o /usr/local/bin/docker-compose"
        echo "  chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
fi

echo "✅ Docker Compose installation completed!"

