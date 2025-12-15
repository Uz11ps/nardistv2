FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/

# Используем npm ci для быстрой установки (требует package-lock.json)
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit --progress=false || \
    npm install --legacy-peer-deps --prefer-offline --no-audit --progress=false

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS production

WORKDIR /app

# Копируем только package.json для production зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости с оптимизацией
RUN npm ci --only=production --legacy-peer-deps --prefer-offline --no-audit --progress=false || \
    npm install --only=production --legacy-peer-deps --prefer-offline --no-audit --progress=false && \
    npx prisma generate

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
