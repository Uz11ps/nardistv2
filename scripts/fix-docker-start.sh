#!/bin/bash

set -e

echo "🔧 Исправление проблем с Docker daemon..."

# Останавливаем snap версию Docker полностью
echo "🛑 Останавливаем snap версию Docker..."
systemctl stop snap.docker.dockerd.service 2>/dev/null || true
systemctl disable snap.docker.dockerd.service 2>/dev/null || true
snap stop docker 2>/dev/null || true
snap disable docker 2>/dev/null || true

# Останавливаем apt версию Docker
echo "🛑 Останавливаем apt версию Docker..."
systemctl stop docker 2>/dev/null || true
systemctl stop docker.socket 2>/dev/null || true

# Удаляем старые сокеты если есть
echo "🧹 Очистка старых сокетов..."
rm -f /var/run/docker.sock /run/docker.sock 2>/dev/null || true

# Проверяем статус Docker
echo "📊 Проверка статуса Docker daemon..."
if systemctl is-active --quiet docker; then
    echo "✅ Docker daemon уже запущен"
else
    echo "⚠️  Docker daemon не запущен, запускаем..."
    
    # Запускаем Docker socket сначала
    systemctl start docker.socket 2>/dev/null || true
    
    # Запускаем Docker daemon
    systemctl start docker
    systemctl enable docker
    
    # Ждем запуска
    echo "⏳ Ожидание запуска Docker daemon..."
    sleep 10
    
    # Проверяем что запустился
    MAX_RETRIES=5
    RETRY=0
    while [ $RETRY -lt $MAX_RETRIES ]; do
        if systemctl is-active --quiet docker; then
            echo "✅ Docker daemon успешно запущен"
            break
        else
            RETRY=$((RETRY + 1))
            echo "  Попытка $RETRY из $MAX_RETRIES..."
            sleep 2
            systemctl start docker 2>/dev/null || true
        fi
    done
    
    if ! systemctl is-active --quiet docker; then
        echo "❌ Не удалось запустить Docker daemon"
        echo "📋 Проверяем логи..."
        journalctl -u docker --no-pager -n 50
        exit 1
    fi
fi

# Проверяем доступность Docker API
echo "🔍 Проверка доступности Docker API..."
MAX_API_RETRIES=10
API_RETRY=0
while [ $API_RETRY -lt $MAX_API_RETRIES ]; do
    if sudo docker info > /dev/null 2>&1; then
        echo "✅ Docker API доступен"
        break
    else
        API_RETRY=$((API_RETRY + 1))
        echo "  Ожидание Docker API... ($API_RETRY/$MAX_API_RETRIES)"
        sleep 2
    fi
done

if ! sudo docker info > /dev/null 2>&1; then
    echo "❌ Docker API недоступен"
    echo "📋 Проверяем сокет..."
    ls -la /var/run/docker.sock /run/docker.sock 2>/dev/null || echo "Сокет не найден"
    echo "📋 Проверяем статус сервиса..."
    systemctl status docker --no-pager -l | head -20
    exit 1
fi

# Проверяем порты 80 и 443
echo "🔍 Проверка портов 80 и 443..."
if lsof -i :80 2>/dev/null | grep -v docker; then
    echo "⚠️  Порт 80 занят не-Docker процессом:"
    lsof -i :80 | grep -v docker
    echo "🛑 Останавливаем системный nginx..."
    systemctl stop nginx 2>/dev/null || true
    systemctl disable nginx 2>/dev/null || true
fi

if lsof -i :443 2>/dev/null | grep -v docker; then
    echo "⚠️  Порт 443 занят не-Docker процессом:"
    lsof -i :443 | grep -v docker
    echo "🛑 Останавливаем системный nginx..."
    systemctl stop nginx 2>/dev/null || true
    systemctl disable nginx 2>/dev/null || true
fi

echo "✅ Готово! Docker daemon запущен и порты свободны"
