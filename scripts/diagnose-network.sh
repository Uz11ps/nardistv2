#!/bin/bash

echo "🔍 Диагностика сетевых проблем..."

cd /opt/Nardist || exit 1

# Проверяем iptables правила
echo "📋 Проверка iptables правил для Docker сети..."
iptables -L DOCKER -n -v | head -20 || echo "⚠️  Не удалось проверить iptables"

echo ""
echo "🔍 Проверка подключения из postgres контейнера к самому себе..."
docker exec nardist_postgres_prod sh -c "nc -zv 172.18.0.3 5432" 2>&1 || echo "⚠️  Postgres не может подключиться к себе"

echo ""
echo "🔍 Проверка подключения из backend контейнера к postgres по IP..."
docker exec nardist_backend_prod sh -c "nc -zv 172.18.0.3 5432" 2>&1 || echo "⚠️  Backend не может подключиться к postgres по IP"

echo ""
echo "🔍 Проверка подключения через psql из backend..."
docker exec nardist_backend_prod sh -c "which psql" 2>&1 || echo "psql не установлен в backend"

echo ""
echo "🔍 Проверка конфигурации postgres..."
docker exec nardist_postgres_prod sh -c "cat /var/lib/postgresql/data/postgresql.conf | grep listen_addresses" || echo "Не удалось проверить конфигурацию"

echo ""
echo "🔍 Проверка что postgres слушает на всех интерфейсах..."
docker exec nardist_postgres_prod sh -c "ss -tlnp | grep 5432 || netstat -tlnp | grep 5432" || echo "Не удалось проверить"

echo ""
echo "✅ Диагностика завершена"
