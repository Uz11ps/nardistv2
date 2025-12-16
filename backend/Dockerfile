FROM node:18-alpine AS builder

WORKDIR /app

# Скачиваем готовые бинарники OpenSSL 1.1.x из другого образа
# Создаем папку libssl/openssl где Prisma ищет библиотеки
RUN mkdir -p /libssl/openssl
COPY --from=alpine:3.16 /usr/lib/libssl.so.1.1 /libssl/openssl/libssl.so.1.1
COPY --from=alpine:3.16 /usr/lib/libcrypto.so.1.1 /libssl/openssl/libcrypto.so.1.1
COPY --from=alpine:3.16 /usr/lib/libssl.so.1.1 /usr/lib/libssl.so.1.1
COPY --from=alpine:3.16 /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1

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
# Указываем Prisma где искать библиотеки OpenSSL 1.1.x в папке libssl/openssl
RUN export PRISMA_OPENSSL_LIBRARY=/libssl/openssl/libssl.so.1.1 && \
    export PRISMA_OPENSSL_LIBRARY_CRYPTO=/libssl/openssl/libcrypto.so.1.1 && \
    export LD_LIBRARY_PATH=/libssl/openssl:/usr/lib:/lib:${LD_LIBRARY_PATH:-} && \
    ls -la /libssl/openssl/ && \
    npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Скачиваем готовые бинарники OpenSSL 1.1.x из другого образа
# Создаем папку libssl/openssl где Prisma ищет библиотеки
RUN mkdir -p /libssl/openssl
COPY --from=alpine:3.16 /usr/lib/libssl.so.1.1 /libssl/openssl/libssl.so.1.1
COPY --from=alpine:3.16 /usr/lib/libcrypto.so.1.1 /libssl/openssl/libcrypto.so.1.1
COPY --from=alpine:3.16 /usr/lib/libssl.so.1.1 /usr/lib/libssl.so.1.1
COPY --from=alpine:3.16 /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1

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
