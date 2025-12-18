FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL и необходимые библиотеки для Prisma
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    ca-certificates \
    && update-ca-certificates

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

# Устанавливаем переменные окружения для Prisma ДО установки
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=30000
ENV npm_config_fetch_retries=5
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=false
ENV PRISMA_BINARY_DOWNLOAD_TIMEOUT=180000
ENV PRISMA_OPENSSL_BINARY=/usr/lib/libssl.so.3
ENV PRISMA_OPENSSL_LIBRARY=/usr/lib/libssl.so.3
ENV OPENSSL_CONF=/dev/null
ENV LD_LIBRARY_PATH=/usr/lib:/lib

# Проверяем установку OpenSSL
RUN echo "=== OPENSSL CHECK ===" && \
    openssl version && \
    ls -la /usr/lib/libssl.so* /usr/lib/libcrypto.so* 2>/dev/null || echo "OpenSSL libraries check" && \
    echo "=== END OPENSSL CHECK ==="

# Устанавливаем зависимости (Prisma postinstall скрипт установит бинарники автоматически)
RUN npm install --legacy-peer-deps --no-audit

# Проверяем что Prisma бинарники установлены
RUN echo "=== PRISMA CHECK ===" && \
    ls -la node_modules/.prisma/client 2>/dev/null || echo "Prisma client not generated yet" && \
    ls -la node_modules/@prisma/engines 2>/dev/null | head -10 || echo "Prisma engines not found" && \
    echo "=== END CHECK ==="

# Генерируем Prisma клиент с явным указанием OpenSSL
RUN PRISMA_OPENSSL_BINARY=/usr/lib/libssl.so.3 \
    PRISMA_OPENSSL_LIBRARY=/usr/lib/libssl.so.3 \
    LD_LIBRARY_PATH=/usr/lib:/lib \
    npx prisma generate || \
    (echo "Prisma generate failed, retrying..." && \
     sleep 5 && \
     PRISMA_OPENSSL_BINARY=/usr/lib/libssl.so.3 \
     PRISMA_OPENSSL_LIBRARY=/usr/lib/libssl.so.3 \
     LD_LIBRARY_PATH=/usr/lib:/lib \
     npx prisma generate)

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем OpenSSL для runtime
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    ca-certificates \
    && update-ca-certificates

# Устанавливаем переменные окружения для Prisma runtime
ENV PRISMA_OPENSSL_BINARY=/usr/lib/libssl.so.3
ENV PRISMA_OPENSSL_LIBRARY=/usr/lib/libssl.so.3
ENV LD_LIBRARY_PATH=/usr/lib:/lib
ENV OPENSSL_CONF=/dev/null

# Копируем только package.json для production зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=30000
ENV npm_config_fetch_retries=5
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm install --only=production --legacy-peer-deps --no-audit

# Копируем собранное приложение и сгенерированный Prisma клиент
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Добавляем healthcheck для проверки готовности приложения
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
