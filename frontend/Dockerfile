FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Используем npm ci для быстрой установки (требует package-lock.json)
RUN npm ci --prefer-offline --no-audit --progress=false || \
    npm install --legacy-peer-deps --prefer-offline --no-audit --progress=false

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
