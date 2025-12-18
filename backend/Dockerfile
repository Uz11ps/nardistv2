FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем зависимости для кэширования
COPY package*.json ./
# Используем cache mount для ускорения установки
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps --no-audit --progress=false --loglevel=warn --prefer-offline

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент перед сборкой
RUN npx prisma generate || echo "Prisma generate skipped"

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --only=production --legacy-peer-deps --no-audit --progress=false --loglevel=warn --prefer-offline

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
