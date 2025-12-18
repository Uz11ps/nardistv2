#!/bin/bash

# Сборка с использованием BuildKit для ускорения
# BuildKit использует cache mounts и параллельную сборку

set -e

echo "🚀 Сборка с BuildKit (оптимизированная)"
echo ""

cd /opt/Nardist

# Включаем BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Останавливаем старые контейнеры
docker compose -f docker-compose.prod.yml down

# Собираем с оптимизированным Dockerfile
echo "🏗️ Собираем backend с BuildKit..."
docker build \
    --progress=plain \
    --no-cache \
    -f backend/Dockerfile.optimized \
    -t nardist-backend:latest \
    backend/

# Запускаем контейнеры
echo "🚀 Запускаем контейнеры..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Сборка завершена!"
echo "📝 Логи:"
docker compose -f docker-compose.prod.yml logs --tail=50 backend
