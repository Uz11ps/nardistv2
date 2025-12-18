FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Устанавливаем все зависимости для сборки (включая dev)
RUN npm install --legacy-peer-deps --no-audit

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps --no-audit

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
