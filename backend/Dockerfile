FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем только базовые пакеты (OpenSSL обычно уже есть в alpine)
RUN apk add --no-cache openssl

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (Prisma автоматически сгенерирует клиент через postinstall)
ENV npm_config_loglevel=warn
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=false
RUN npm install --legacy-peer-deps --no-audit

# Явно генерируем Prisma клиент используя локальную версию из node_modules
RUN npm run prisma:generate || ./node_modules/.bin/prisma generate || echo "Prisma generate failed, will retry"

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем OpenSSL и утилиты для проверки сетевого подключения
RUN apk add --no-cache openssl netcat-openbsd

# Копируем package.json и prisma для генерации клиента на сервере
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем все зависимости (включая dev для prisma CLI)
ENV npm_config_loglevel=warn
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=false
RUN npm install --legacy-peer-deps --no-audit

# Генерируем Prisma клиент используя локальную версию (будет перегенерирован на сервере если нужно)
RUN npm run prisma:generate || ./node_modules/.bin/prisma generate || echo "Prisma generate failed, will retry on server"

# Копируем собранное приложение и сгенерированный Prisma клиент из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Добавляем healthcheck для проверки готовности приложения
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
