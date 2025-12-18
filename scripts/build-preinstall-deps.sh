#!/bin/bash

# Самый быстрый вариант: предварительно устанавливаем зависимости на сервере,
# затем используем простой Dockerfile который просто копирует готовые файлы

set -e

echo "🚀 Быстрая сборка с предустановленными зависимостями"
echo ""

cd /opt/Nardist

# 1. Обновляем код
echo "📥 Обновляем код из Git..."
git pull origin main

# 2. Устанавливаем зависимости на сервере (быстрее чем в Docker)
echo "📦 Устанавливаем зависимости backend на сервере..."
cd backend
rm -rf node_modules package-lock.json dist

echo "⏳ Это может занять 2-5 минут..."
npm install --legacy-peer-deps --no-audit --progress=false --prefer-offline=false

# 3. Собираем приложение на сервере
echo "🏗️ Собираем приложение на сервере..."
npm run build

# 4. Временно переименовываем .dockerignore (он игнорирует node_modules)
if [ -f .dockerignore ]; then
    mv .dockerignore .dockerignore.backup
fi

# 5. Создаем минималистичный Dockerfile
cat > Dockerfile.fast << 'EOF'
FROM node:18-slim

WORKDIR /app

# Копируем только необходимые файлы
COPY package*.json ./
COPY node_modules ./node_modules
COPY dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
EOF

# 6. Собираем Docker образ (очень быстро, так как все уже готово)
echo "🐳 Собираем Docker образ (быстро, так как зависимости уже установлены)..."
cd ..
docker build -f backend/Dockerfile.fast -t nardist-backend:latest backend/

# 7. Восстанавливаем .dockerignore
cd backend
if [ -f .dockerignore.backup ]; then
    mv .dockerignore.backup .dockerignore
fi
cd ..

# 8. Останавливаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker compose -f docker-compose.prod.yml down

# 9. Запускаем новые (используем --no-build чтобы не пересобирать уже собранный образ)
echo "🚀 Запускаем новые контейнеры..."
docker compose -f docker-compose.prod.yml up -d --no-build backend
docker compose -f docker-compose.prod.yml up -d --no-build frontend
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Быстрая сборка завершена!"
echo "📝 Логи:"
docker compose -f docker-compose.prod.yml logs --tail=50 backend
