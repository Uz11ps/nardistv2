FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL для Prisma (без обновления индекса для ускорения)
# OpenSSL обычно уже есть в node:18-alpine, просто проверяем и создаем symlinks
# В Alpine 3.21 используется OpenSSL 3, создаем symlinks для совместимости с Prisma
RUN apk add --no-cache --update-cache openssl 2>/dev/null || \
    (echo "OpenSSL already installed or installing..." && \
     apk add --no-cache openssl) && \
    mkdir -p /usr/lib && \
    (ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 2>/dev/null || true) && \
    (ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 2>/dev/null || true)

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Используем npm ci для быстрой установки (требует package-lock.json)
# Устанавливаем ВСЕ зависимости (включая devDependencies) для сборки
# Используем кэш npm для ускорения
ENV npm_config_loglevel=warn
ENV npm_config_cache=/root/.npm
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit --progress=false || \
    npm install --legacy-peer-deps --prefer-offline --no-audit --progress=false

# Убеждаемся что Prisma установлен (он в devDependencies)
RUN npm list prisma || npm install prisma@5.7.1 --legacy-peer-deps --save-dev

# Проверяем наличие schema.prisma
RUN test -f prisma/schema.prisma || (echo "ERROR: prisma/schema.prisma not found!" && ls -la prisma/ && exit 1)

# Показываем версию Prisma для отладки
RUN npx prisma --version || echo "Prisma not found in PATH"

# Генерируем Prisma клиент (DATABASE_URL не нужен для generate)
RUN npx prisma generate --schema=./prisma/schema.prisma || \
    (echo "Prisma generate failed, trying to reinstall..." && \
     npm install prisma@5.7.1 @prisma/client@5.7.1 --legacy-peer-deps --save-dev && \
     npx prisma generate --schema=./prisma/schema.prisma)

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем OpenSSL для Prisma (без обновления индекса для ускорения)
RUN apk add --no-cache --update-cache openssl 2>/dev/null || \
    apk add --no-cache openssl && \
    mkdir -p /usr/lib && \
    (ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 2>/dev/null || true) && \
    (ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 2>/dev/null || true)

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
