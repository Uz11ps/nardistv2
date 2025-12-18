#!/bin/bash

set -e

echo "🔍 ПОЛНАЯ ДИАГНОСТИКА И ИСПРАВЛЕНИЕ СЕТИ DOCKER"
echo "================================================"
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

# 1. ПРОВЕРКА СЕТИ DOCKER
echo "1️⃣ ПРОВЕРКА СЕТИ DOCKER"
echo "-----------------------"
if docker network inspect nardist_network >/dev/null 2>&1; then
    echo "✅ Сеть nardist_network существует"
    echo "📋 Контейнеры в сети:"
    docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}' || echo "Нет контейнеров"
else
    echo "❌ Сеть nardist_network НЕ существует!"
    echo "🔧 Создаю сеть..."
    docker network create nardist_network --driver bridge --subnet 172.18.0.0/16
    echo "✅ Сеть создана"
fi
echo ""

# 2. ПРОВЕРКА КОНТЕЙНЕРА POSTGRES
echo "2️⃣ ПРОВЕРКА КОНТЕЙНЕРА POSTGRES"
echo "-------------------------------"
if docker ps -a --format '{{.Names}}' | grep -q "^nardist_postgres_prod$"; then
    echo "✅ Контейнер postgres существует"
    
    # Проверяем статус
    POSTGRES_STATUS=$(docker inspect nardist_postgres_prod --format '{{.State.Status}}' 2>/dev/null || echo "not found")
    echo "📊 Статус: $POSTGRES_STATUS"
    
    if [ "$POSTGRES_STATUS" != "running" ]; then
        echo "🔧 Запускаю контейнер postgres..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
        echo "⏳ Жду 10 секунд..."
        sleep 10
    fi
    
    # Проверяем подключение к сети
    if docker inspect nardist_postgres_prod --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null | grep -q nardist_network; then
        echo "✅ Postgres подключен к сети nardist_network"
        POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{if eq .NetworkID (index (docker network ls -q -f name=nardist_network) 0)}}{{.IPAddress}}{{end}}{{end}}' 2>/dev/null || \
                     docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | head -1)
        echo "📍 IP адрес: $POSTGRES_IP"
    else
        echo "❌ Postgres НЕ подключен к сети nardist_network!"
        echo "🔧 Переподключаю контейнер к сети..."
        docker network connect nardist_network nardist_postgres_prod 2>/dev/null || {
            echo "⚠️  Не удалось подключить, пересоздаю контейнер..."
            $DOCKER_COMPOSE -f docker-compose.prod.yml stop postgres
            $DOCKER_COMPOSE -f docker-compose.prod.yml rm -f postgres
            $DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
            sleep 10
        }
        POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | head -1)
        echo "📍 Новый IP адрес: $POSTGRES_IP"
    fi
else
    echo "❌ Контейнер postgres НЕ существует!"
    echo "🔧 Создаю контейнер..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
    echo "⏳ Жду 15 секунд..."
    sleep 15
    POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | head -1)
    echo "📍 IP адрес: $POSTGRES_IP"
fi
echo ""

# 3. ПРОВЕРКА ЧТО POSTGRES СЛУШАЕТ НА ПОРТУ
echo "3️⃣ ПРОВЕРКА ЧТО POSTGRES СЛУШАЕТ НА ПОРТУ 5432"
echo "----------------------------------------------"
echo "🔍 Проверяю что PostgreSQL слушает на порту 5432..."
if docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep -q ":5432"; then
    echo "✅ PostgreSQL слушает на порту 5432"
    docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep 5432
elif docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep -q ":5432"; then
    echo "✅ PostgreSQL слушает на порту 5432 (ss)"
    docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep 5432
else
    echo "❌ PostgreSQL НЕ слушает на порту 5432!"
    echo "📋 Проверяю логи PostgreSQL..."
    docker logs nardist_postgres_prod --tail 20
    echo ""
    echo "⚠️  Возможно PostgreSQL не запустился правильно. Проверяю процесс..."
    docker exec nardist_postgres_prod ps aux | grep postgres || echo "Процесс postgres не найден!"
fi
echo ""

# 4. ПРОВЕРКА ПОДКЛЮЧЕНИЯ POSTGRES К САМОМУ СЕБЕ
echo "4️⃣ ПРОВЕРКА ПОДКЛЮЧЕНИЯ POSTGRES К САМОМУ СЕБЕ"
echo "----------------------------------------------"
if [ -n "$POSTGRES_IP" ]; then
    echo "📍 Тестирую подключение к $POSTGRES_IP:5432..."
    
    # Тест через nc
    if docker exec nardist_postgres_prod sh -c "echo '' | timeout 3 nc -w 2 $POSTGRES_IP 5432" >/dev/null 2>&1; then
        echo "✅ nc: подключение работает"
    else
        echo "❌ nc: подключение НЕ работает"
    fi
    
    # Тест через pg_isready
    echo "🔍 Тестирую через pg_isready..."
    if docker exec nardist_postgres_prod pg_isready -h $POSTGRES_IP -U ${POSTGRES_USER:-nardist} >/dev/null 2>&1; then
        echo "✅ pg_isready: PostgreSQL готов"
    else
        echo "❌ pg_isready: PostgreSQL НЕ готов"
        docker exec nardist_postgres_prod pg_isready -h $POSTGRES_IP -U ${POSTGRES_USER:-nardist} 2>&1 || true
    fi
    
    # Тест через localhost
    echo "🔍 Тестирую через localhost..."
    if docker exec nardist_postgres_prod pg_isready -h localhost -U ${POSTGRES_USER:-nardist} >/dev/null 2>&1; then
        echo "✅ localhost: PostgreSQL готов"
    else
        echo "❌ localhost: PostgreSQL НЕ готов"
    fi
    
    # Тест через имя контейнера
    echo "🔍 Тестирую через имя контейнера 'postgres'..."
    if docker exec nardist_postgres_prod pg_isready -h postgres -U ${POSTGRES_USER:-nardist} >/dev/null 2>&1; then
        echo "✅ postgres: PostgreSQL готов"
    else
        echo "❌ postgres: PostgreSQL НЕ готов (DNS может не работать внутри контейнера)"
    fi
else
    echo "❌ Не удалось определить IP адрес postgres"
fi
echo ""

# 5. ПРОВЕРКА pg_hba.conf
echo "5️⃣ ПРОВЕРКА КОНФИГУРАЦИИ pg_hba.conf"
echo "--------------------------------------"
echo "🔍 Проверяю pg_hba.conf..."
docker exec nardist_postgres_prod cat /var/lib/postgresql/data/pg_hba.conf 2>/dev/null | grep -v "^#" | grep -v "^$" | head -10 || echo "Не удалось прочитать pg_hba.conf"
echo ""

# 6. ПРОВЕРКА IPTABLES
echo "6️⃣ ПРОВЕРКА IPTABLES"
echo "---------------------"
echo "🔍 Проверяю правила iptables для Docker..."
if command -v iptables >/dev/null 2>&1; then
    echo "📋 FORWARD chain (Docker использует это):"
    iptables -L FORWARD -n -v | head -10 || echo "Не удалось проверить FORWARD"
    echo ""
    echo "📋 DOCKER chain:"
    iptables -L DOCKER -n -v 2>/dev/null | head -10 || echo "DOCKER chain не существует"
else
    echo "⚠️  iptables не доступен (может быть на Windows или без прав)"
fi
echo ""

# 7. ИСПРАВЛЕНИЕ: ПЕРЕСОЗДАНИЕ СЕТИ И КОНТЕЙНЕРОВ
echo "7️⃣ ИСПРАВЛЕНИЕ: ПЕРЕСОЗДАНИЕ СЕТИ"
echo "----------------------------------"
echo "🛑 Останавливаю все контейнеры..."
$DOCKER_COMPOSE -f docker-compose.prod.yml stop postgres redis backend 2>/dev/null || true
sleep 2

echo "🗑️  Удаляю старые контейнеры..."
docker rm -f nardist_postgres_prod nardist_redis_prod nardist_backend_prod 2>/dev/null || true
sleep 2

echo "🌐 Удаляю и пересоздаю сеть..."
docker network rm nardist_network 2>/dev/null || true
sleep 2
docker network create nardist_network --driver bridge --subnet 172.18.0.0/16
echo "✅ Сеть пересоздана"
sleep 2

echo "🚀 Запускаю postgres..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
echo "⏳ Жду 15 секунд для запуска PostgreSQL..."
sleep 15

# Проверяем что postgres запустился
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker exec nardist_postgres_prod pg_isready -U ${POSTGRES_USER:-nardist} >/dev/null 2>&1; then
        echo "✅ PostgreSQL готов!"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "  Ожидание... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ PostgreSQL не стал готовым за отведенное время!"
    echo "📋 Логи PostgreSQL:"
    docker logs nardist_postgres_prod --tail 30
    exit 1
fi
echo ""

# 8. ФИНАЛЬНАЯ ПРОВЕРКА
echo "8️⃣ ФИНАЛЬНАЯ ПРОВЕРКА ПОДКЛЮЧЕНИЯ"
echo "----------------------------------"
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | head -1)
echo "📍 Postgres IP: $POSTGRES_IP"

echo "🔍 Тестирую подключение из postgres к самому себе..."
if docker exec nardist_postgres_prod sh -c "echo '' | timeout 3 nc -w 2 $POSTGRES_IP 5432" >/dev/null 2>&1; then
    echo "✅ ✅ ✅ ПОДКЛЮЧЕНИЕ РАБОТАЕТ!"
else
    echo "❌ Подключение все еще не работает"
    echo "📋 Детальная диагностика:"
    echo "  - Проверка сетевых интерфейсов:"
    docker exec nardist_postgres_prod ip addr show | grep -E "inet.*172.18" || echo "    Нет интерфейса с 172.18"
    echo "  - Проверка маршрутизации:"
    docker exec nardist_postgres_prod ip route | grep 172.18 || echo "    Нет маршрута к 172.18"
    echo "  - Проверка что слушает:"
    docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep 5432 || docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep 5432 || echo "    Не слушает на 5432"
fi

echo ""
echo "🔍 Тестирую подключение через имя 'postgres'..."
if docker exec nardist_postgres_prod pg_isready -h postgres -U ${POSTGRES_USER:-nardist} >/dev/null 2>&1; then
    echo "✅ ✅ ✅ DNS РАБОТАЕТ!"
else
    echo "⚠️  DNS не работает, но это нормально для self-connect"
fi

echo ""
echo "✅ ДИАГНОСТИКА ЗАВЕРШЕНА!"
echo ""
echo "📊 Статус сети:"
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}'

