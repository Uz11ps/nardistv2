#!/bin/bash

echo "🔧 Исправление сетевых проблем Docker..."

# Проверяем и исправляем iptables правила для Docker
echo "📋 Проверка iptables правил..."
if command -v iptables >/dev/null 2>&1; then
    echo "Текущие правила DOCKER chain:"
    iptables -L DOCKER -n -v | head -10 || echo "DOCKER chain не найдена"
fi

# Перезапускаем Docker daemon для сброса сетевых правил
echo "🔄 Перезапуск Docker daemon..."
systemctl restart docker || service docker restart

echo "⏳ Ожидание готовности Docker (5 секунд)..."
sleep 5

# Проверяем что Docker работает
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker не запустился!"
    exit 1
fi

echo "✅ Docker перезапущен"

# Пересоздаем сеть
cd /opt/Nardist || exit 1

echo "🌐 Пересоздание Docker сети..."
docker compose -f docker-compose.prod.yml down
sleep 2
docker network rm nardist_network 2>/dev/null || true
sleep 2
docker compose -f docker-compose.prod.yml up -d postgres redis
sleep 10

# Проверяем подключение
echo "🔍 Проверка подключения после исправления..."
docker run --rm --network nardist_network alpine sh -c "nc -zv postgres 5432" 2>&1 && echo "✅ Подключение работает!" || echo "⚠️  Подключение все еще не работает"

echo "✅ Исправление завершено"
