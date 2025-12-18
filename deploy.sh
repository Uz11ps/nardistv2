#!/bin/bash

set -e

# Определяем команду docker compose (новая версия) или docker-compose (старая версия)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "🚀 Starting deployment..."
echo "📝 Using: $DOCKER_COMPOSE"

# Load environment variables
if [ -f .env ]; then
    # Загружаем переменные из .env файла
    set -a
    source .env
    set +a
    echo "✅ Environment variables loaded from .env"
else
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with required variables"
    exit 1
fi

# Check if domain is set
if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Error: DOMAIN_NAME not set in .env file!"
    exit 1
fi

echo "📦 Pulling base images (postgres, redis, nginx, certbot)..."
$DOCKER_COMPOSE -f docker-compose.prod.yml pull postgres redis nginx certbot || echo "⚠️  Some base images pull failed, will use cached versions"

# Проверяем, есть ли готовые образы в GitHub Container Registry
if [ -n "$BACKEND_IMAGE" ] && [ "$BACKEND_IMAGE" != "nardist-backend:latest" ] && [ -n "$FRONTEND_IMAGE" ] && [ "$FRONTEND_IMAGE" != "nardist-frontend:latest" ]; then
    echo "📥 Attempting to pull pre-built images from GitHub Container Registry..."
    
    BACKEND_PULLED=false
    FRONTEND_PULLED=false
    
    if docker pull ${BACKEND_IMAGE} 2>/dev/null; then
        echo "✅ Backend image pulled successfully"
        BACKEND_PULLED=true
    else
        echo "⚠️  Backend image not found in registry, will build locally"
    fi
    
    if docker pull ${FRONTEND_IMAGE} 2>/dev/null; then
        echo "✅ Frontend image pulled successfully"
        FRONTEND_PULLED=true
    else
        echo "⚠️  Frontend image not found in registry, will build locally"
    fi
    
    # Если оба образа скачаны, используем их, иначе собираем недостающие
    if [ "$BACKEND_PULLED" = true ] && [ "$FRONTEND_PULLED" = true ]; then
        echo "✅ Using pre-built images from registry (much faster!)"
        USE_PREBUILT=true
    else
        echo "🔨 Building missing images locally (this may take 5-10 minutes)..."
        export DOCKER_BUILDKIT=1
        export COMPOSE_DOCKER_CLI_BUILD=1
        USE_PREBUILT=false
        
        if [ "$BACKEND_PULLED" = false ]; then
            echo "🔨 Building backend..."
            $DOCKER_COMPOSE -f docker-compose.prod.yml build backend
        fi
        
        if [ "$FRONTEND_PULLED" = false ]; then
            echo "🔨 Building frontend..."
            $DOCKER_COMPOSE -f docker-compose.prod.yml build frontend
        fi
    fi
else
    echo "🔨 Building application images locally (this may take 5-10 minutes)..."
    echo "💡 Tip: Set BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest and FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest in .env to use pre-built images"
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    $DOCKER_COMPOSE -f docker-compose.prod.yml build --parallel backend frontend
    USE_PREBUILT=false
fi

echo "🚀 Starting containers (recreating with new images)..."
# Если образы уже скачаны, не пересобираем их
if [ "$USE_PREBUILT" = true ]; then
    echo "📦 Using pre-built images, skipping build..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml up -d --force-recreate --no-build --pull never
else
    $DOCKER_COMPOSE -f docker-compose.prod.yml up -d --force-recreate
fi

echo "⏳ Waiting for services to be ready..."
sleep 10

# Ждем пока backend контейнер станет готовым
echo "⏳ Waiting for backend container to be ready..."
MAX_BACKEND_RETRIES=30
BACKEND_RETRY=0
while [ $BACKEND_RETRY -lt $MAX_BACKEND_RETRIES ]; do
    if $DOCKER_COMPOSE -f docker-compose.prod.yml ps backend | grep -q "Up"; then
        # Проверяем что контейнер не перезапускается
        CONTAINER_STATUS=$($DOCKER_COMPOSE -f docker-compose.prod.yml ps backend | grep backend | awk '{print $4}')
        if [ "$CONTAINER_STATUS" != "Restarting" ]; then
            echo "✅ Backend container is ready"
            sleep 5  # Дополнительное ожидание для полной инициализации
            break
        fi
    fi
    BACKEND_RETRY=$((BACKEND_RETRY + 1))
    echo "  Waiting for backend... ($BACKEND_RETRY/$MAX_BACKEND_RETRIES)"
    sleep 2
done

echo "🔧 Generating Prisma client..."
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npm run prisma:generate || \
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npx --package=prisma@5.20.0 prisma generate || \
echo "⚠️  Prisma generate failed, continuing..."

echo "🗄️ Running database migrations..."
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npx --package=prisma@5.20.0 prisma migrate deploy || echo "⚠️  Migrations failed or not needed, continuing..."

echo "🔒 Setting up SSL certificate..."
if [ ! -d "./nginx/ssl/live/${DOMAIN_NAME}" ] || [ ! -f "./nginx/ssl/live/${DOMAIN_NAME}/fullchain.pem" ]; then
    echo "📝 Requesting SSL certificate..."
    echo "⚠️  Note: SSL certificate setup requires the domain to point to this server"
    echo "⚠️  Make sure DNS is configured before running this step"
    $DOCKER_COMPOSE -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email ${SSL_EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN_NAME} \
        -d www.${DOMAIN_NAME} || echo "⚠️  SSL certificate request failed. You can set it up later."
    echo "🔄 Reloading Nginx..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || echo "⚠️  Nginx reload skipped (may not be running yet)"
else
    echo "✅ SSL certificate already exists"
fi

echo "🧹 Cleaning up..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is available at: https://${DOMAIN_NAME}"

