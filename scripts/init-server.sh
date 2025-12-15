#!/bin/bash

set -e

echo "🚀 Initializing server for Nardist deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y curl git ufw

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Добавляем пользователя в группу docker
    usermod -aG docker $SUDO_USER
    echo "✅ Docker installed. You may need to log out and log back in for group changes to take effect."
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/nardist
chown -R $SUDO_USER:$SUDO_USER /opt/nardist

echo "✅ Server initialization completed!"
echo "📝 Next steps:"
echo "   1. Clone your repository: git clone https://github.com/Uz11ps/Nardist.git /opt/Nardist"
echo "   2. Copy .env.example to .env and configure it"
echo "   3. Run ./deploy.sh"

