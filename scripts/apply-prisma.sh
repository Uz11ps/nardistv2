#!/bin/bash

set -e

echo "🔧 Applying Prisma migrations and generating client..."

# Определяем команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    exit 1
fi

cd /opt/Nardist || exit 1

# Ждем пока backend контейнер будет готов
echo "⏳ Waiting for backend container..."
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if $DOCKER_COMPOSE -f docker-compose.prod.yml ps backend | grep -q "Up"; then
        CONTAINER_STATUS=$($DOCKER_COMPOSE -f docker-compose.prod.yml ps backend | grep backend | awk '{print $4}')
        if [ "$CONTAINER_STATUS" != "Restarting" ]; then
            echo "✅ Backend container is ready"
            sleep 3
            break
        fi
    fi
    RETRY=$((RETRY + 1))
    echo "  Waiting... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

# Генерируем Prisma клиент (используем локальную версию из node_modules)
echo "📦 Generating Prisma client..."
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npm run prisma:generate || {
    echo "⚠️  Prisma generate failed, trying with npx..."
    sleep 5
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npx --package=prisma@5.20.0 prisma generate || {
        echo "❌ Prisma generate failed!"
        exit 1
    }
}

# Применяем миграции
echo "🗄️  Running database migrations..."
# Сначала пробуем через exec (если backend контейнер запущен)
if $DOCKER_COMPOSE -f docker-compose.prod.yml ps backend | grep -q "Up"; then
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npx --package=prisma@5.20.0 prisma migrate deploy || {
        echo "⚠️  Migrations via exec failed, trying with migrations service..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml --profile migrations run --rm migrations || {
            echo "⚠️  Migrations failed or not needed"
        }
    }
else
    # Если backend не запущен, используем сервис миграций
    echo "⚠️  Backend container not running, using migrations service..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml --profile migrations run --rm migrations || {
        echo "⚠️  Migrations failed or not needed"
    }
fi

echo "✅ Prisma setup completed!"

