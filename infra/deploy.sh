#!/bin/bash
set -e

echo "Starting deployment..."

# Update system
apt-get update
apt-get install -y docker.io docker-compose git certbot

# Stop any running services
systemctl stop nginx || true
docker-compose -f infra/docker-compose.prod.yml down || true

# Setup directory
mkdir -p /opt/nardist
cd /opt/nardist

# Clone/Update repo
if [ -d ".git" ]; then
    echo "Updating repository..."
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/Uz11ps/nardistv2.git .
fi

# Setup Environment Variables
if [ ! -f .env ]; then
    echo "Creating .env file..."
    
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        read -p "Enter Telegram Bot Token: " TELEGRAM_BOT_TOKEN
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
    echo ".env file created."
else
    echo ".env file exists, skipping creation."
fi

# SSL Certificate
if [ ! -d "/etc/letsencrypt/live/nardist.online" ]; then
    echo "Obtaining SSL certificate for nardist.online..."
    certbot certonly --standalone -d nardist.online --non-interactive --agree-tos -m admin@nardist.online
else
    echo "SSL certificate already exists."
fi

# Start Application
echo "Building and starting containers..."
docker-compose -f infra/docker-compose.prod.yml up -d --build

echo "------------------------------------------------"
echo "Deployment completed successfully!"
echo "Website: https://nardist.online"
echo "API: https://nardist.online/api"
echo "------------------------------------------------"
