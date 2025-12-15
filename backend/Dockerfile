FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Используем npm install, так как package-lock.json может отсутствовать
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production --legacy-peer-deps
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]

