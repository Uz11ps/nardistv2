FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL 1.1.x из Alpine 3.16 репозитория
# Создаем папку libssl/openssl где Prisma ищет библиотеки
RUN mkdir -p /libssl/openssl && \
    apk add --no-cache --allow-untrusted || true && \
    wget -q -O /tmp/libssl.tar.gz https://dl-cdn.alpinelinux.org/alpine/v3.16/main/x86_64/libssl1.1-1.1.1t-r0.apk 2>/dev/null || \
    (echo "http://dl-cdn.alpinelinux.org/alpine/v3.16/main" >> /etc/apk/repositories && \
     apk add --no-cache libssl1.1=1.1.1t-r0 || \
     apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.16/main libssl1.1)

# Копируем библиотеки в нужные места
RUN if [ -f /usr/lib/libssl.so.1.1 ]; then \
        cp /usr/lib/libssl.so.1.1 /libssl/openssl/libssl.so.1.1 && \
        cp /usr/lib/libcrypto.so.1.1 /libssl/openssl/libcrypto.so.1.1; \
    elif [ -f /lib/libssl.so.1.1 ]; then \
        cp /lib/libssl.so.1.1 /libssl/openssl/libssl.so.1.1 && \
        cp /lib/libcrypto.so.1.1 /libssl/openssl/libcrypto.so.1.1 && \
        cp /lib/libssl.so.1.1 /usr/lib/libssl.so.1.1 && \
        cp /lib/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1; \
    else \
        echo "Installing from alpine:3.16..." && \
        apk add --no-cache --virtual .temp-deps wget tar gzip && \
        wget -q -O /tmp/alpine.tar.gz http://dl-cdn.alpinelinux.org/alpine/v3.16/releases/x86_64/alpine-minirootfs-3.16.0-x86_64.tar.gz && \
        tar -xzf /tmp/alpine.tar.gz -C /tmp/alpine-root 2>/dev/null || true && \
        cp /tmp/alpine-root/usr/lib/libssl.so.1.1 /libssl/openssl/libssl.so.1.1 2>/dev/null || true && \
        cp /tmp/alpine-root/usr/lib/libcrypto.so.1.1 /libssl/openssl/libcrypto.so.1.1 2>/dev/null || true && \
        cp /libssl/openssl/libssl.so.1.1 /usr/lib/libssl.so.1.1 2>/dev/null || true && \
        cp /libssl/openssl/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1 2>/dev/null || true && \
        apk del .temp-deps 2>/dev/null || true && \
        rm -rf /tmp/alpine-root /tmp/alpine.tar.gz; \
    fi

# Альтернативный метод: копируем из alpine:3.16 образа напрямую
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
# Указываем Prisma где искать библиотеки OpenSSL 1.1.x
ENV PRISMA_OPENSSL_LIBRARY=/libssl/openssl/libssl.so.1.1
ENV PRISMA_OPENSSL_LIBRARY_CRYPTO=/libssl/openssl/libcrypto.so.1.1
ENV LD_LIBRARY_PATH=/libssl/openssl:/usr/lib:/lib:${LD_LIBRARY_PATH:-}
RUN npx prisma generate

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
