FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем зависимости для кэширования
COPY package*.json ./
# Устанавливаем все зависимости для сборки (включая dev)
RUN npm install --legacy-peer-deps --no-audit --progress=false --loglevel=warn

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент перед сборкой
RUN npx prisma generate || echo "Prisma generate skipped"

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps --no-audit --progress=false --loglevel=warn

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
