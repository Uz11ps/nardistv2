#!/bin/bash

set -e

echo "🔧 Исправление проблемы с Docker сетью..."

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

# Загружаем переменные окружения
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo "✅ Environment variables loaded"
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "🛑 Останавливаем все контейнеры..."
$DOCKER_COMPOSE -f docker-compose.prod.yml down || true

echo "🗑️  Удаляем старые контейнеры..."
docker rm -f nardist_backend_prod nardist_frontend_prod nardist_postgres_prod nardist_redis_prod nardist_nginx_prod nardist_certbot 2>/dev/null || true

echo "🌐 Удаляем старую сеть (если есть)..."
docker network rm nardist_network 2>/dev/null || true

echo "⏳ Ждем 3 секунды..."
sleep 3

echo "🚀 Пересоздаем контейнеры и сеть..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d

echo "⏳ Ждем пока контейнеры запустятся (15 секунд)..."
sleep 15

echo "📊 Проверяем статус контейнеров..."
$DOCKER_COMPOSE -f docker-compose.prod.yml ps

echo ""
echo "🌐 Проверяем сеть..."
docker network inspect nardist_network 2>/dev/null && echo "✅ Сеть создана успешно" || echo "❌ Сеть не создана!"

echo ""
echo "⏳ Ждем готовности postgres и redis (30 секунд)..."
sleep 30

# Проверяем готовность postgres
echo "🏥 Проверяем healthcheck postgres..."
MAX_RETRIES=20
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-nardist} >/dev/null 2>&1; then
        echo "✅ Postgres готов"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "  Ожидание postgres... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

# Проверяем готовность redis
echo "🏥 Проверяем healthcheck redis..."
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis готов"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "  Ожидание redis... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

# Ждем пока backend контейнер станет готовым и не будет перезапускаться
echo "⏳ Ждем готовности backend контейнера..."
MAX_BACKEND_RETRIES=30
BACKEND_RETRY=0
while [ $BACKEND_RETRY -lt $MAX_BACKEND_RETRIES ]; do
    if $DOCKER_COMPOSE -f docker-compose.prod.yml ps backend | grep -q "Up"; then
        CONTAINER_STATUS=$($DOCKER_COMPOSE -f docker-compose.prod.yml ps backend | grep backend | awk '{print $4}' || echo "")
        if [ "$CONTAINER_STATUS" != "Restarting" ] && [ -n "$CONTAINER_STATUS" ]; then
            echo "✅ Backend контейнер готов (статус: $CONTAINER_STATUS)"
            sleep 5
            break
        fi
    fi
    BACKEND_RETRY=$((BACKEND_RETRY + 1))
    echo "  Ожидание backend... ($BACKEND_RETRY/$MAX_BACKEND_RETRIES)"
    sleep 2
done

# Проверяем подключение из backend к postgres
echo "🔗 Проверяем подключение из backend к postgres..."
# Проверяем DNS резолвинг
echo "🔍 Проверка DNS резолвинга..."
if $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend sh -c "getent hosts postgres" >/dev/null 2>&1; then
    POSTGRES_IP=$($DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend getent hosts postgres | awk '{print $1}')
    echo "✅ DNS работает: postgres -> $POSTGRES_IP"
else
    echo "❌ DNS резолвинг не работает!"
fi

# Проверяем сетевое подключение несколькими способами
if $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend sh -c "nc -zv postgres 5432" 2>&1 | grep -qE "(succeeded|open)"; then
    echo "✅ Подключение к postgres работает (nc)"
elif $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend sh -c "timeout 3 sh -c '</dev/tcp/postgres/5432'" 2>/dev/null; then
    echo "✅ Подключение к postgres работает (tcp)"
else
    echo "⚠️  Подключение к postgres не работает"
    echo "🔍 Детальная диагностика сети..."
    echo "Информация о сети:"
    docker network inspect nardist_network 2>/dev/null | grep -A 20 "Containers" || echo "Сеть не найдена"
    echo ""
    echo "IP адреса контейнеров:"
    echo "Backend:"
    docker inspect nardist_backend_prod 2>/dev/null | grep -A 5 "IPAddress" || echo "Не найден"
    echo "Postgres:"
    docker inspect nardist_postgres_prod 2>/dev/null | grep -A 5 "IPAddress" || echo "Не найден"
    echo ""
    echo "Логи backend:"
    $DOCKER_COMPOSE -f docker-compose.prod.yml logs --tail=50 backend
fi

echo ""
echo "🔧 Генерируем Prisma клиент..."
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npm run prisma:generate || \
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npx --package=prisma@5.20.0 prisma generate || \
echo "⚠️  Prisma generate failed"

echo ""
echo "🗄️  Применяем миграции базы данных..."
# Пробуем через exec (если backend контейнер запущен)
if $DOCKER_COMPOSE -f docker-compose.prod.yml ps backend 2>/dev/null | grep -q "Up"; then
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend npx --package=prisma@5.20.0 prisma migrate deploy || {
        echo "⚠️  Migrations via exec failed, trying with migrations service..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml --profile migrations run --rm migrations || echo "⚠️  Migrations failed"
    }
else
    # Если backend не запущен, используем сервис миграций
    echo "⚠️  Backend container not running, using migrations service..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml --profile migrations run --rm migrations || echo "⚠️  Migrations failed"
fi

echo ""
echo "✅ Исправление завершено!"
echo "📊 Финальный статус контейнеров:"
$DOCKER_COMPOSE -f docker-compose.prod.yml ps
