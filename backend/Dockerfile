FROM node:18-slim AS builder

WORKDIR /app

# Настраиваем npm для ускорения установки
ENV npm_config_loglevel=warn
ENV npm_config_progress=false
ENV npm_config_audit=false
ENV npm_config_fetch_timeout=300000
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_factor=10
ENV npm_config_fetch_retry_mintimeout=10000
ENV npm_config_fetch_retry_maxtimeout=60000

# Устанавливаем зависимости для кэширования
COPY package*.json ./

# Устанавливаем зависимости с таймаутами и retry
# Используем cache mount для ускорения (требует BuildKit: DOCKER_BUILDKIT=1)
RUN --mount=type=cache,target=/root/.npm \
    echo "📦 Installing dependencies..." && \
    npm install --legacy-peer-deps --no-audit --progress=false --prefer-offline=false --fetch-timeout=300000 --maxsockets=15 || \
    (echo "⚠️ First attempt failed, retrying..." && \
     sleep 5 && \
     npm install --legacy-peer-deps --no-audit --progress=false --prefer-offline=false --fetch-timeout=300000 --maxsockets=15)

# Копируем исходный код
COPY . .

# Собираем приложение
RUN echo "🏗️ Building application..." && \
    npm run build && \
    echo "✅ Build completed"

FROM node:18-slim AS production

WORKDIR /app

# Настраиваем npm для production
ENV npm_config_loglevel=warn
ENV npm_config_progress=false
ENV npm_config_audit=false
ENV npm_config_fetch_timeout=300000
ENV npm_config_fetch_retries=5

# Копируем package.json и node_modules из builder (быстрее чем переустановка)
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Добавляем healthcheck для проверки готовности приложения
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
