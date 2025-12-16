FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL для Prisma
# В Alpine 3.21 используется OpenSSL 3, создаем symlinks для совместимости с Prisma
RUN (apk info openssl >/dev/null 2>&1 && echo "OpenSSL already installed") || \
    (apk add --no-cache openssl || echo "OpenSSL install skipped") && \
    mkdir -p /usr/lib && \
    (ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 || true) && \
    (ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 || true)

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Используем npm ci для быстрой установки (требует package-lock.json)
ENV npm_config_loglevel=error
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit --progress=false --silent || \
    npm install --legacy-peer-deps --prefer-offline --no-audit --progress=false --silent

# Генерируем Prisma клиент (нужны все зависимости)
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем OpenSSL для Prisma
# В Alpine 3.21 используется OpenSSL 3, создаем symlinks для совместимости с Prisma
RUN (apk info openssl >/dev/null 2>&1 && echo "OpenSSL already installed") || \
    (apk add --no-cache openssl || echo "OpenSSL install skipped") && \
    mkdir -p /usr/lib && \
    (ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 || true) && \
    (ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 || true)

# Копируем только package.json для production зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости с оптимизацией
ENV npm_config_loglevel=error
RUN npm ci --only=production --legacy-peer-deps --prefer-offline --no-audit --progress=false --silent || \
    npm install --only=production --legacy-peer-deps --prefer-offline --no-audit --progress=false --silent

# Копируем собранное приложение и сгенерированный Prisma клиент
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/main"]
