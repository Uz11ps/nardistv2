#!/bin/bash

# Альтернативный способ сборки: устанавливаем зависимости локально, затем копируем в Docker
# Это быстрее, так как npm работает напрямую на сервере, а не внутри Docker

set -e

echo "🚀 Альтернативная сборка с локальной установкой зависимостей"
echo ""

cd /opt/Nardist/backend

# 1. Очищаем старые зависимости
echo "🧹 Очищаем старые зависимости..."
rm -rf node_modules package-lock.json

# 2. Устанавливаем зависимости локально (быстрее чем в Docker)
echo "📦 Устанавливаем зависимости локально..."
npm install --legacy-peer-deps --no-audit --progress=false

# 3. Собираем приложение локально
echo "🏗️ Собираем приложение локально..."
npm run build

# 4. Создаем временный Dockerfile, который просто копирует готовые файлы
cat > Dockerfile.local << 'EOF'
FROM node:18-slim

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Копируем готовые node_modules и dist
COPY node_modules ./node_modules
COPY dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
EOF

# 5. Собираем Docker образ (быстро, так как зависимости уже установлены)
echo "🐳 Собираем Docker образ..."
cd /opt/Nardist
docker build -f backend/Dockerfile.local -t nardist-backend:latest backend/

# 6. Обновляем docker-compose для использования нового образа
echo "🚀 Запускаем контейнеры..."
docker compose -f docker-compose.prod.yml up -d backend

echo ""
echo "✅ Сборка завершена!"
echo "📝 Логи:"
docker compose -f docker-compose.prod.yml logs --tail=50 backend
