#!/bin/bash
set -e

echo "========================================="
echo "Starting Nardist deployment..."
echo "========================================="

# Update system
echo "Updating system packages..."
apt-get update -qq
apt-get install -y docker.io docker-compose-plugin git certbot python3-certbot-nginx

# Stop any running services
echo "Stopping existing services..."
systemctl stop nginx 2>/dev/null || true
cd /opt/nardist 2>/dev/null && docker-compose -f infra/docker-compose.prod.yml down 2>/dev/null || true

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
        echo "Enter Telegram Bot Token (или установите переменную TELEGRAM_BOT_TOKEN):"
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
    # Проверяем наличие токена
    if ! grep -q "TELEGRAM_BOT_TOKEN" .env || grep -q "TELEGRAM_BOT_TOKEN=$" .env; then
        echo "WARNING: TELEGRAM_BOT_TOKEN not set in .env file!"
    fi
fi

# SSL Certificate
echo "Checking SSL certificate..."
if [ ! -d "/etc/letsencrypt/live/nardist.online" ]; then
    echo "Obtaining SSL certificate for nardist.online..."
    # Останавливаем nginx если запущен
    systemctl stop nginx 2>/dev/null || true
    certbot certonly --standalone -d nardist.online --non-interactive --agree-tos --email admin@nardist.online || {
        echo "WARNING: Failed to obtain SSL certificate. Continuing anyway..."
    }
else
    echo "SSL certificate already exists."
fi

# Start Application
echo "Building and starting containers..."
cd /opt/nardist

# Проверяем наличие docker-compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

echo "Running database migrations..."
$DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml run --rm backend npx prisma migrate deploy || {
    echo "Running initial migration..."
    $DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml run --rm backend npx prisma migrate dev --name init || true
}

echo "Starting all services..."
$DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml up -d --build

echo "Waiting for services to start..."
sleep 10

echo "Checking service status..."
$DOCKER_COMPOSE_CMD -f infra/docker-compose.prod.yml ps

echo ""
echo "========================================="
echo "Deployment completed!"
echo "========================================="
echo "Website: https://nardist.online"
echo "API: https://nardist.online/api"
echo ""
echo "To check logs:"
echo "  docker-compose -f infra/docker-compose.prod.yml logs -f"
echo ""
echo "To restart services:"
echo "  docker-compose -f infra/docker-compose.prod.yml restart"
echo "========================================="
