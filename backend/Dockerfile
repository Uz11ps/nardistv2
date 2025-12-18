FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем только базовые пакеты (OpenSSL обычно уже есть в alpine)
RUN apk add --no-cache openssl

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (Prisma generate будет выполнен на сервере)
ENV npm_config_loglevel=warn
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm install --legacy-peer-deps --no-audit

# Копируем исходный код
COPY . .

# Собираем приложение (Prisma клиент будет сгенерирован на сервере)
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем OpenSSL для runtime (обычно уже есть)
RUN apk add --no-cache openssl

# Копируем package.json и prisma для генерации клиента на сервере
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем все зависимости (включая dev для prisma CLI)
ENV npm_config_loglevel=warn
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm install --legacy-peer-deps --no-audit

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Prisma клиент будет сгенерирован на сервере через команду

EXPOSE 3000

# Добавляем healthcheck для проверки готовности приложения
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
