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

# Проверяем что PostgreSQL запущен (с несколькими попытками)
echo "⏳ Проверяем статус PostgreSQL..."
for i in {1..10}; do
    if docker compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ PostgreSQL контейнер не запущен после 10 попыток!"
        exit 1
    fi
    sleep 2
done

echo "✅ PostgreSQL контейнер запущен"
echo ""

# Проверяем существует ли база данных
# Подключаемся к системной базе данных 'postgres' для проверки
echo "🔍 Проверяем существование базы данных '$POSTGRES_DB'..."
DB_EXISTS=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ База данных '$POSTGRES_DB' уже существует"
else
    echo "⚠️  База данных '$POSTGRES_DB' не найдена, создаём..."
    
    # Создаем базу данных, подключаясь к системной базе 'postgres'
    # Используем переменную окружения PGPASSWORD для аутентификации
    docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;" 2>&1 || {
        echo "❌ Не удалось создать базу данных"
        echo "Попытка через альтернативный метод..."
        # Альтернативный способ: используем команду createdb через bash
        docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres bash -c "createdb -U $POSTGRES_USER $POSTGRES_DB" 2>&1 || {
            echo "❌ Все попытки создания базы данных не удались"
            exit 1
        }
    }
    
    echo "✅ База данных '$POSTGRES_DB' успешно создана"
fi

echo ""
echo "📊 Список баз данных:"
docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres psql -U "$POSTGRES_USER" -d postgres -c "\l" 2>/dev/null || \
docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "\l"

echo ""
echo "✅ Проверка завершена!"
