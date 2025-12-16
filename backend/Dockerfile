# ============================================
# Stage 1: Builder - сборка приложения
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем OpenSSL для Prisma (без обновления индекса - используем существующий кэш)
RUN apk add --no-cache openssl

# Копируем файлы зависимостей для кэширования
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Устанавливаем все зависимости (включая devDependencies для сборки)
# --ignore-scripts пропускает postinstall скрипты которые могут зависать
RUN npm install --legacy-peer-deps --ignore-scripts

# Генерируем Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# ============================================
# Stage 2: Production - финальный образ
# ============================================
FROM node:18-alpine AS production

WORKDIR /app

# OpenSSL уже есть в node:18-alpine, дополнительная установка не требуется

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Копируем package.json для production зависимостей
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
ENV npm_config_fetch_timeout=60000
ENV npm_config_fetch_retries=3
RUN npm ci --only=production --legacy-peer-deps --prefer-offline --no-audit --silent --progress=false && \
    npm cache clean --force

# Копируем собранное приложение и Prisma Client из builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Переключаемся на непривилегированного пользователя
USER nestjs

# Открываем порт
EXPOSE 3000

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck (проверяет /health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаем приложение
CMD ["node", "dist/main"]
