FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL 1.1.x из edge репозитория для Prisma
RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main openssl1.1 || \
    apk add --no-cache openssl || true

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

# Устанавливаем зависимости (используем npm ci для скорости, fallback на npm install)
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=10000
ENV npm_config_fetch_retries=3
# --ignore-scripts пропускает postinstall скрипты которые могут зависать
RUN npm install --legacy-peer-deps --no-audit --ignore-scripts

# Генерируем Prisma клиент (нужны все зависимости)
# Устанавливаем переменные окружения для OpenSSL 3.0.x
RUN SSL_PATH=$(find /usr/lib /lib -name "libssl.so.3" 2>/dev/null | head -1) && \
    CRYPTO_PATH=$(find /usr/lib /lib -name "libcrypto.so.3" 2>/dev/null | head -1) && \
    export PRISMA_OPENSSL_LIBRARY=${SSL_PATH:-/usr/lib/libssl.so.3} && \
    export PRISMA_OPENSSL_LIBRARY_CRYPTO=${CRYPTO_PATH:-/usr/lib/libcrypto.so.3} && \
    npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем OpenSSL 1.1.x из edge репозитория для Prisma
RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main openssl1.1 || \
    apk add --no-cache openssl || true

# Копируем только package.json для production зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=10000
ENV npm_config_fetch_retries=3
RUN npm install --only=production --legacy-peer-deps --no-audit --ignore-scripts

# Копируем собранное приложение и сгенерированный Prisma клиент
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/main"]
