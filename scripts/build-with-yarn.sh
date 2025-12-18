#!/bin/bash

# Альтернатива: использование Yarn вместо npm (может быть быстрее)

set -e

echo "🚀 Сборка с использованием Yarn"
echo ""

cd /opt/Nardist/backend

# Устанавливаем Yarn глобально (если еще не установлен)
if ! command -v yarn &> /dev/null; then
    echo "📦 Устанавливаем Yarn..."
    npm install -g yarn
fi

# Создаем Dockerfile с Yarn
cat > Dockerfile.yarn << 'EOF'
FROM node:18-slim AS builder

WORKDIR /app

# Устанавливаем Yarn
RUN npm install -g yarn

# Настраиваем Yarn
ENV YARN_CACHE_FOLDER=/root/.yarn-cache
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false

# Копируем package файлы
COPY package.json yarn.lock* ./

# Устанавливаем зависимости через Yarn
RUN --mount=type=cache,target=/root/.yarn-cache \
    if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile --network-timeout 300000; \
    else \
        yarn install --network-timeout 300000; \
    fi

# Копируем исходный код
COPY . .

# Собираем приложение
RUN yarn build

FROM node:18-slim AS production

WORKDIR /app

# Устанавливаем Yarn
RUN npm install -g yarn

# Копируем package.json
COPY package.json ./

# Копируем node_modules из builder
COPY --from=builder /app/node_modules ./node_modules

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
EOF

# Генерируем yarn.lock если его нет
if [ ! -f yarn.lock ]; then
    echo "📝 Генерируем yarn.lock..."
    yarn install --frozen-lockfile || yarn install
fi

# Собираем Docker образ
cd /opt/Nardist
docker build -f backend/Dockerfile.yarn -t nardist-backend:latest backend/

# Запускаем
docker compose -f docker-compose.prod.yml up -d backend

echo ""
echo "✅ Сборка с Yarn завершена!"
docker compose -f docker-compose.prod.yml logs --tail=50 backend
