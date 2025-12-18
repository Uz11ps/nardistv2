#!/bin/bash

set -e

echo "🗄️  Running Prisma migrations..."

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

# Убеждаемся, что postgres запущен и здоров
# Docker Compose автоматически создаст сеть при запуске сервисов
echo "⏳ Waiting for postgres to be ready..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-nardist} >/dev/null 2>&1; then
        echo "✅ Postgres is ready"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "  Waiting... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ Postgres did not become ready in time!"
    exit 1
fi

# Пробуем через exec (если backend контейнер запущен)
if $DOCKER_COMPOSE -f docker-compose.prod.yml ps backend 2>/dev/null | grep -q "Up"; then
    echo "📦 Using existing backend container for migrations..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend sh -c "npm run prisma:generate && npx prisma migrate deploy" || {
        echo "⚠️  Migrations via exec failed, trying with migrations service..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml --profile migrations run --rm migrations
    }
else
    # Если backend не запущен, используем сервис миграций
    echo "📦 Using migrations service (backend not running)..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml --profile migrations run --rm migrations
fi

echo "✅ Migrations completed!"

