FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL 1.1.x из репозитория Alpine 3.16
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v3.16/main" >> /etc/apk/repositories && \
    apk add --no-cache libssl1.1 libcrypto1.1 || \
    (apk add --no-cache --allow-untrusted libssl1.1 libcrypto1.1 || true)

# Проверяем что OpenSSL установлен
RUN ls -la /usr/lib/libssl.so.1.1 /usr/lib/libcrypto.so.1.1 || \
    ls -la /lib/libssl.so.1.1 /lib/libcrypto.so.1.1 || \
    find /usr/lib /lib -name "libssl.so.1.1" -o -name "libcrypto.so.1.1"

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
# Устанавливаем LD_LIBRARY_PATH для поиска OpenSSL
ENV LD_LIBRARY_PATH=/usr/lib:/lib:${LD_LIBRARY_PATH:-}
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем OpenSSL 1.1.x для runtime
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v3.16/main" >> /etc/apk/repositories && \
    apk add --no-cache libssl1.1 libcrypto1.1 || \
    (apk add --no-cache --allow-untrusted libssl1.1 libcrypto1.1 || true)

# Устанавливаем LD_LIBRARY_PATH для runtime
ENV LD_LIBRARY_PATH=/usr/lib:/lib:${LD_LIBRARY_PATH:-}


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
