#!/bin/bash
set -e

echo "========================================="
echo "Деплой Nardist для ISPmanager"
echo "========================================="

# Update system
echo "Updating system packages..."
apt-get update -qq

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker не установлен!"
    echo "Установите Docker через ISPmanager или вручную"
    exit 1
else
    echo "Docker установлен: $(docker --version)"
fi

# Проверяем docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "ERROR: docker-compose не найден!"
    exit 1
fi

echo "Using: $DOCKER_COMPOSE_CMD"

# Setup directory
echo "Setting up project directory..."
mkdir -p /opt/nardist
cd /opt/nardist

# Clone/Update repo
if [ -d ".git" ]; then
    echo "Updating repository..."
    git pull || true
else
    echo "Cloning repository..."
    git clone https://github.com/Uz11ps/nardistv2.git .
fi

# Setup Environment Variables
if [ ! -f .env ]; then
    echo "Creating .env file..."
    
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo "Enter Telegram Bot Token:"
        read -p "Token: " TELEGRAM_BOT_TOKEN
    fi

    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo "ERROR: Telegram Bot Token is required!"
        exit 1
    fi

    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    
    cat <<EOF > .env
POSTGRES_USER=nardist
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=nardist_db
JWT_SECRET=$JWT_SECRET
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
EOF
    echo ".env file created successfully."
else
    echo ".env file already exists."
fi

# Stop any running containers
echo "Stopping existing containers..."
$DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml down 2>/dev/null || true

# Start Application (без nginx, используем ISPmanager)
echo "Building and starting containers..."
$DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml up -d --build

echo "Waiting for services to start..."
sleep 10

echo "Running database migrations..."
$DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml exec -T backend npx prisma migrate deploy || {
    echo "Running initial migration..."
    $DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml exec -T backend npx prisma migrate dev --name init || true
}

echo "Checking service status..."
$DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml ps

echo ""
echo "========================================="
echo "Deployment completed!"
echo "========================================="
echo "Services are running on:"
echo "  Frontend: http://localhost:8080"
echo "  Backend:  http://localhost:3000"
echo ""
echo "ВАЖНО: Настройте проксирование в ISPmanager:"
echo "  1. Откройте настройки домена nardist.online"
echo "  2. Добавьте проксирование:"
echo "     - / -> http://localhost:8080"
echo "     - /api/ -> http://localhost:3000/api/"
echo "     - /socket.io/ -> http://localhost:3000"
echo ""
echo "Конфигурация находится в: infra/ispmanager-nginx-config.conf"
echo "========================================="
