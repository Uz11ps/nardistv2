FROM node:18-alpine AS builder

WORKDIR /app

# OpenSSL уже установлен в node:18-alpine, просто создаем symlinks для Prisma
RUN mkdir -p /usr/lib && \
    (ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 2>/dev/null || true) && \
    (ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 2>/dev/null || true)

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (используем npm ci для скорости, fallback на npm install)
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=10000
ENV npm_config_fetch_retries=3
# npm ci быстрее и надежнее, но требует синхронизированный lock файл
# --ignore-scripts пропускает postinstall скрипты которые могут зависать
RUN npm ci --legacy-peer-deps --no-audit --ignore-scripts || \
    (echo "⚠️ npm ci failed, using npm install..." && npm install --legacy-peer-deps --no-audit --ignore-scripts)

# Генерируем Prisma клиент (нужны все зависимости)
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# OpenSSL уже установлен в node:18-alpine, просто создаем symlinks для Prisma
RUN mkdir -p /usr/lib && \
    (ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 2>/dev/null || true) && \
    (ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 2>/dev/null || true)

# Копируем только package.json для production зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости (используем npm ci для скорости)
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=10000
ENV npm_config_fetch_retries=3
RUN npm ci --only=production --legacy-peer-deps --no-audit --ignore-scripts || \
    (echo "⚠️ npm ci failed, using npm install..." && npm install --only=production --legacy-peer-deps --no-audit --ignore-scripts)

# Копируем собранное приложение и сгенерированный Prisma клиент
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/main"]
