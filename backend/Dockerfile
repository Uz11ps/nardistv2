FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (включая dev зависимости для Prisma CLI)
# OpenSSL уже есть в базовом образе alpine, не устанавливаем
ENV npm_config_loglevel=error
ENV npm_config_prefer_offline=true
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm ci --legacy-peer-deps --no-audit --prefer-offline || npm install --legacy-peer-deps --no-audit --prefer-offline

# Генерируем Prisma клиент (только типы, без подключения к БД)
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Копируем package.json для фильтрации зависимостей
COPY package*.json ./

# Копируем все node_modules из builder и удаляем dev зависимости
# Это быстрее чем повторная установка всех пакетов
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --production --legacy-peer-deps --no-audit

# Копируем собранное приложение и сгенерированный Prisma клиент из builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Добавляем healthcheck для проверки готовности приложения
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main"]
