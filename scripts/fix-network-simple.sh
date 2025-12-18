#!/bin/bash

set -e

echo "🔧 ПРОСТОЕ ИСПРАВЛЕНИЕ СЕТИ"
echo "============================"
echo ""

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
    echo "⚠️  .env file not found, using defaults"
fi

POSTGRES_USER=${POSTGRES_USER:-nardist}
POSTGRES_DB=${POSTGRES_DB:-nardist_db}

# 1. ОСТАНОВКА И ОЧИСТКА
echo "1️⃣ ОСТАНОВКА И ОЧИСТКА"
echo "----------------------"
$DOCKER_COMPOSE -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
sleep 2

# Удаляем все контейнеры проекта
docker ps -a --filter "name=nardist_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
sleep 2

# Удаляем сеть если она существует (чтобы Docker Compose создал её заново с правильными метками)
if docker network inspect nardist_network >/dev/null 2>&1; then
    echo "🗑️  Удаляю существующую сеть..."
    # Отключаем все контейнеры от сети
    CONTAINERS=$(docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "")
    if [ -n "$CONTAINERS" ]; then
        for container in $CONTAINERS; do
            docker network disconnect -f nardist_network "$container" 2>/dev/null || true
        done
    fi
    docker network rm nardist_network 2>/dev/null || true
    sleep 3
fi
echo "✅ Очистка завершена"
echo ""

# 2. ЗАПУСК POSTGRES (Docker Compose создаст сеть автоматически)
echo "2️⃣ ЗАПУСК POSTGRES"
echo "-------------------"
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
echo "⏳ Жду 20 секунд для полного запуска PostgreSQL..."
sleep 20

# 3. ПРОВЕРКА СЕТИ
echo "3️⃣ ПРОВЕРКА СЕТИ"
echo "-----------------"
if docker network inspect nardist_network >/dev/null 2>&1; then
    echo "✅ Сеть nardist_network создана"
    echo "📋 Контейнеры в сети:"
    docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}' || echo "Нет контейнеров"
else
    echo "❌ Сеть не создана!"
    exit 1
fi
echo ""

# 4. ОЖИДАНИЕ ГОТОВНОСТИ POSTGRES
echo "4️⃣ ОЖИДАНИЕ ГОТОВНОСТИ POSTGRES"
echo "--------------------------------"
PG_MAX_RETRIES=40
PG_RETRY=0
while [ $PG_RETRY -lt $PG_MAX_RETRIES ]; do
    if docker exec nardist_postgres_prod pg_isready -U $POSTGRES_USER -h localhost >/dev/null 2>&1; then
        echo "✅ PostgreSQL готов!"
        break
    fi
    PG_RETRY=$((PG_RETRY + 1))
    if [ $((PG_RETRY % 5)) -eq 0 ]; then
        echo "  Ожидание PostgreSQL... ($PG_RETRY/$PG_MAX_RETRIES)"
    fi
    sleep 2
done

if [ $PG_RETRY -eq $PG_MAX_RETRIES ]; then
    echo "❌ PostgreSQL не стал готовым!"
    echo "📋 Логи PostgreSQL:"
    docker logs nardist_postgres_prod --tail 30
    exit 1
fi
echo ""

# 5. ИСПРАВЛЕНИЕ pg_hba.conf
echo "5️⃣ ИСПРАВЛЕНИЕ pg_hba.conf"
echo "---------------------------"
PG_HBA="/var/lib/postgresql/data/pg_hba.conf"

echo "🔧 Добавляю правила для Docker сети..."
docker exec nardist_postgres_prod sh -c "
  # Проверяем и добавляем правила для Docker сети
  if ! grep -q '172.18.0.0/16' $PG_HBA; then
    echo '' >> $PG_HBA
    echo '# Docker network rules' >> $PG_HBA
    echo 'host all all 172.18.0.0/16 md5' >> $PG_HBA
    echo 'host all all 172.17.0.0/16 md5' >> $PG_HBA
    echo '✅ Правила добавлены'
  else
    echo '✅ Правила уже существуют'
  fi
  
  # Убеждаемся что есть правило для всех IPv4
  if ! grep -qE '^host.*all.*all.*0\.0\.0\.0/0' $PG_HBA; then
    echo 'host all all 0.0.0.0/0 md5' >> $PG_HBA
    echo '✅ Добавлено правило для всех IPv4'
  fi
" 2>&1

# Перезагружаем конфигурацию
echo "🔄 Перезагружаю конфигурацию PostgreSQL..."
docker exec nardist_postgres_prod psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT pg_reload_conf();" >/dev/null 2>&1 || echo "⚠️  Не удалось перезагрузить конфигурацию"
echo ""

# 6. ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ
echo "6️⃣ ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ"
echo "----------------------------"
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | head -1)
if [ -z "$POSTGRES_IP" ]; then
    echo "❌ Не удалось получить IP адрес postgres!"
    exit 1
fi
echo "📍 Postgres IP: $POSTGRES_IP"

# Тест 1: Подключение через IP
echo "🔍 Тест 1: Подключение через IP ($POSTGRES_IP)..."
if docker exec nardist_postgres_prod sh -c "echo '' | timeout 3 nc -w 2 $POSTGRES_IP 5432" >/dev/null 2>&1; then
    echo "✅ ✅ ✅ ПОДКЛЮЧЕНИЕ ЧЕРЕЗ IP РАБОТАЕТ!"
else
    echo "❌ Подключение через IP НЕ работает"
fi

# Тест 2: pg_isready через IP
echo "🔍 Тест 2: pg_isready через IP..."
if docker exec nardist_postgres_prod pg_isready -h $POSTGRES_IP -U $POSTGRES_USER >/dev/null 2>&1; then
    echo "✅ ✅ ✅ pg_isready через IP РАБОТАЕТ!"
else
    echo "❌ pg_isready через IP НЕ работает"
fi

# Тест 3: psql через IP
echo "🔍 Тест 3: psql через IP..."
if docker exec nardist_postgres_prod psql -h $POSTGRES_IP -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ ✅ ✅ psql через IP РАБОТАЕТ!"
else
    echo "❌ psql через IP НЕ работает"
fi

# Тест 4: Подключение через имя контейнера
echo "🔍 Тест 4: Подключение через имя 'postgres'..."
if docker exec nardist_postgres_prod pg_isready -h postgres -U $POSTGRES_USER >/dev/null 2>&1; then
    echo "✅ ✅ ✅ DNS РАБОТАЕТ!"
else
    echo "⚠️  DNS не работает (нормально для self-connect)"
fi
echo ""

# 7. ФИНАЛЬНАЯ СВОДКА
echo "7️⃣ ФИНАЛЬНАЯ СВОДКА"
echo "-------------------"
echo "📊 Статус сети:"
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}'
echo ""
echo "📊 Статус контейнеров:"
$DOCKER_COMPOSE -f docker-compose.prod.yml ps
echo ""

echo "✅ ✅ ✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo ""
echo "Теперь можно запустить миграции:"
echo "  docker compose -f docker-compose.prod.yml --profile migrations run --rm migrations"

