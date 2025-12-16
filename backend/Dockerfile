FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем openssl1.1-compat для Prisma (Prisma требует OpenSSL 1.1.x)
RUN apk add --no-cache openssl1.1-compat

# Устанавливаем зависимости для кэширования
COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

# Устанавливаем зависимости (используем npm ci для скорости, fallback на npm install)
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=10000
ENV npm_config_fetch_retries=3
# --ignore-scripts пропускает postinstall скрипты которые могут зависать
RUN npm install --legacy-peer-deps --no-audit --ignore-scripts

# Генерируем Prisma клиент (нужны все зависимости)
# Используем npm скрипт который правильно найдет OpenSSL в /lib/x86_64-linux-gnu/
RUN npm run prisma:generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем openssl1.1-compat для Prisma (Prisma требует OpenSSL 1.1.x)
RUN apk add --no-cache openssl1.1-compat

# Копируем только package.json для production зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
ENV npm_config_loglevel=warn
ENV npm_config_fetch_timeout=10000
ENV npm_config_fetch_retries=3
RUN npm install --only=production --legacy-peer-deps --no-audit --ignore-scripts

# Копируем собранное приложение и сгенерированный Prisma клиент
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/main"]
