FROM node:18-slim AS builder

WORKDIR /app

# Настраиваем npm для ускорения установки
ENV npm_config_loglevel=warn
ENV npm_config_progress=false
ENV npm_config_audit=false

# Устанавливаем зависимости для кэширования
COPY package*.json ./

# Используем npm ci с оптимизацией (без --silent для отладки)
RUN echo "📦 Installing dependencies..." && \
    npm ci --legacy-peer-deps --no-audit --progress=false || \
    (echo "⚠️ npm ci failed, trying npm install..." && \
     npm install --legacy-peer-deps --no-audit --progress=false)

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

# Копируем только package.json для production зависимостей
COPY package*.json ./

# Устанавливаем только production зависимости
RUN echo "📦 Installing production dependencies..." && \
    npm ci --only=production --legacy-peer-deps --no-audit --progress=false || \
    (echo "⚠️ npm ci failed, trying npm install..." && \
     npm install --only=production --legacy-peer-deps --no-audit --progress=false)

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
