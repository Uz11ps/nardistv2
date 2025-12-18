FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем только необходимые зависимости для сборки
COPY package*.json ./
# Устанавливаем зависимости без лишних предупреждений
RUN npm install --legacy-peer-deps --no-audit --silent --ignore-scripts || \
    npm install --legacy-peer-deps --no-audit --silent

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps --no-audit --silent

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
