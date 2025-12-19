FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем только необходимые зависимости для сборки
COPY package*.json ./
# Устанавливаем зависимости без лишних предупреждений
RUN npm install --legacy-peer-deps --no-audit --silent --ignore-scripts || \
    npm install --legacy-peer-deps --no-audit --silent

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент (используем npm скрипт)
RUN npm run prisma:generate || npx prisma generate || echo "Prisma generate skipped"

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps --no-audit --silent

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Копируем весь Prisma клиент (и пакет, и сгенерированный клиент)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/main"]
