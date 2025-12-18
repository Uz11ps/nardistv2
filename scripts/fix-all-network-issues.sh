#!/bin/bash

set -e

echo "🔧 АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ С СЕТЬЮ"
echo "=================================================="
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

# 1. ОСТАНОВКА ВСЕГО
echo "1️⃣ ОСТАНОВКА ВСЕХ КОНТЕЙНЕРОВ"
echo "-----------------------------"
$DOCKER_COMPOSE -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
sleep 2

# Удаляем все контейнеры проекта
docker ps -a --filter "name=nardist_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
sleep 2
echo "✅ Все контейнеры остановлены"
echo ""

# 2. УДАЛЕНИЕ И ПЕРЕСОЗДАНИЕ СЕТИ
echo "2️⃣ ПЕРЕСОЗДАНИЕ СЕТИ"
echo "---------------------"
docker network rm nardist_network 2>/dev/null || true
sleep 2
docker network create nardist_network --driver bridge --subnet 172.18.0.0/16
echo "✅ Сеть nardist_network пересоздана"
echo ""

# 3. ЗАПУСК POSTGRES
echo "3️⃣ ЗАПУСК POSTGRES"
echo "-------------------"
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
echo "⏳ Жду 20 секунд для полного запуска PostgreSQL..."
sleep 20

# Ждем пока postgres станет готовым
MAX_RETRIES=40
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker exec nardist_postgres_prod pg_isready -U $POSTGRES_USER -h localhost >/dev/null 2>&1; then
        echo "✅ PostgreSQL готов!"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "  Ожидание PostgreSQL... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ PostgreSQL не стал готовым!"
    echo "📋 Логи PostgreSQL:"
    docker logs nardist_postgres_prod --tail 30
    exit 1
fi
echo ""

# 4. ПРОВЕРКА И ИСПРАВЛЕНИЕ pg_hba.conf
echo "4️⃣ ПРОВЕРКА И ИСПРАВЛЕНИЕ pg_hba.conf"
echo "--------------------------------------"
PG_HBA="/var/lib/postgresql/data/pg_hba.conf"

# Проверяем текущий pg_hba.conf
echo "📋 Текущие правила pg_hba.conf:"
docker exec nardist_postgres_prod cat $PG_HBA 2>/dev/null | grep -v "^#" | grep -v "^$" | head -10 || echo "Не удалось прочитать"

# Добавляем правила для Docker сети если их нет
echo ""
echo "🔧 Добавляю правила для Docker сети..."
docker exec nardist_postgres_prod sh -c "
  # Создаем backup
  cp $PG_HBA ${PG_HBA}.backup 2>/dev/null || true
  
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

# Перезагружаем конфигурацию PostgreSQL
echo ""
echo "🔄 Перезагружаю конфигурацию PostgreSQL..."
docker exec nardist_postgres_prod psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT pg_reload_conf();" >/dev/null 2>&1 || echo "⚠️  Не удалось перезагрузить конфигурацию"
echo ""

# 5. ПРОВЕРКА ЧТО POSTGRES СЛУШАЕТ НА ВСЕХ ИНТЕРФЕЙСАХ
echo "5️⃣ ПРОВЕРКА ЧТО POSTGRES СЛУШАЕТ НА ВСЕХ ИНТЕРФЕЙСАХ"
echo "---------------------------------------------------"
echo "🔍 Проверяю на каких интерфейсах слушает PostgreSQL..."
if docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep -q ":5432"; then
    echo "✅ PostgreSQL слушает на порту 5432:"
    docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep 5432
elif docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep -q ":5432"; then
    echo "✅ PostgreSQL слушает на порту 5432 (ss):"
    docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep 5432
else
    echo "❌ PostgreSQL НЕ слушает на порту 5432!"
    echo "📋 Проверяю конфигурацию postgresql.conf..."
    docker exec nardist_postgres_prod cat /var/lib/postgresql/data/postgresql.conf 2>/dev/null | grep -E "listen_addresses|port" || echo "Не удалось прочитать конфигурацию"
fi
echo ""

# 6. ПОЛУЧЕНИЕ IP АДРЕСА POSTGRES
echo "6️⃣ ПОЛУЧЕНИЕ IP АДРЕСА POSTGRES"
echo "---------------------------------"
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | head -1)
if [ -z "$POSTGRES_IP" ]; then
    echo "❌ Не удалось получить IP адрес postgres!"
    echo "📋 Информация о сети:"
    docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}'
    exit 1
fi
echo "📍 Postgres IP: $POSTGRES_IP"
echo ""

# 7. ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ
echo "7️⃣ ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ"
echo "----------------------------"

# Тест 1: Подключение через IP адрес
echo "🔍 Тест 1: Подключение через IP адрес ($POSTGRES_IP)..."
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
    docker exec nardist_postgres_prod pg_isready -h $POSTGRES_IP -U $POSTGRES_USER 2>&1 || true
fi

# Тест 3: psql через IP
echo "🔍 Тест 3: psql через IP..."
if docker exec nardist_postgres_prod psql -h $POSTGRES_IP -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ ✅ ✅ psql через IP РАБОТАЕТ!"
else
    echo "❌ psql через IP НЕ работает"
    docker exec nardist_postgres_prod psql -h $POSTGRES_IP -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" 2>&1 | head -5 || true
fi

# Тест 4: Подключение через localhost
echo "🔍 Тест 4: Подключение через localhost..."
if docker exec nardist_postgres_prod pg_isready -h localhost -U $POSTGRES_USER >/dev/null 2>&1; then
    echo "✅ localhost работает"
else
    echo "❌ localhost НЕ работает"
fi

# Тест 5: Подключение через имя контейнера (DNS)
echo "🔍 Тест 5: Подключение через имя 'postgres' (DNS)..."
if docker exec nardist_postgres_prod pg_isready -h postgres -U $POSTGRES_USER >/dev/null 2>&1; then
    echo "✅ ✅ ✅ DNS РАБОТАЕТ!"
else
    echo "⚠️  DNS не работает (нормально для self-connect)"
fi
echo ""

# 8. ЗАПУСК REDIS ДЛЯ ДОПОЛНИТЕЛЬНОГО ТЕСТА
echo "8️⃣ ЗАПУСК REDIS И ТЕСТИРОВАНИЕ МЕЖДУ КОНТЕЙНЕРАМИ"
echo "-------------------------------------------------"
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d redis
sleep 5

# Тестируем подключение из redis к postgres
echo "🔍 Тестирую подключение из redis к postgres..."
if docker exec nardist_redis_prod sh -c "echo '' | timeout 3 nc -w 2 $POSTGRES_IP 5432" >/dev/null 2>&1; then
    echo "✅ ✅ ✅ ПОДКЛЮЧЕНИЕ ИЗ ДРУГОГО КОНТЕЙНЕРА РАБОТАЕТ!"
else
    echo "❌ Подключение из другого контейнера НЕ работает"
fi
echo ""

# 9. ФИНАЛЬНАЯ СВОДКА
echo "9️⃣ ФИНАЛЬНАЯ СВОДКА"
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

