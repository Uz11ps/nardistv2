FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем только базовые пакеты (OpenSSL обычно уже есть в alpine)
RUN apk add --no-cache openssl

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (включая dev зависимости для Prisma CLI)
ENV npm_config_loglevel=warn
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm install --legacy-peer-deps --no-audit

# Генерируем Prisma клиент (только типы, без подключения к БД)
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
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

# Копируем собранное приложение и сгенерированный Prisma клиент
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Добавляем healthcheck для проверки готовности приложения
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
