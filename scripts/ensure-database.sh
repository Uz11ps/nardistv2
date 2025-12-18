#!/bin/bash

# Скрипт для проверки и создания базы данных если её нет

set -e

echo "🔍 Проверка базы данных..."
echo ""

cd /opt/Nardist

# Загружаем переменные окружения
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo "✅ Environment variables loaded"
else
    echo "⚠️  .env file not found, using defaults"
fi

POSTGRES_USER=${POSTGRES_USER:-nardist}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-nardist_password}
POSTGRES_DB=${POSTGRES_DB:-nardist_db}

echo "📝 Параметры подключения:"
echo "   User: $POSTGRES_USER"
echo "   Database: $POSTGRES_DB"
echo ""

# Проверяем что PostgreSQL запущен
if ! docker compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    echo "❌ PostgreSQL контейнер не запущен!"
    exit 1
fi

echo "✅ PostgreSQL контейнер запущен"
echo ""

# Проверяем существует ли база данных
echo "🔍 Проверяем существование базы данных '$POSTGRES_DB'..."
DB_EXISTS=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ База данных '$POSTGRES_DB' уже существует"
else
    echo "⚠️  База данных '$POSTGRES_DB' не найдена, создаём..."
    
    # Создаем базу данных
    docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;" 2>&1 || {
        # Если не получилось подключиться как пользователь, пробуем через postgres
        echo "⚠️  Попытка создать через пользователя postgres..."
        docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -c "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;" 2>&1 || {
            echo "❌ Не удалось создать базу данных"
            exit 1
        }
    }
    
    echo "✅ База данных '$POSTGRES_DB' успешно создана"
fi

echo ""
echo "📊 Список баз данных:"
docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -c "\l" 2>/dev/null || \
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -c "\l"

echo ""
echo "✅ Проверка завершена!"
