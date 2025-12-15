FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Используем npm ci если есть package-lock.json, иначе npm install с оптимизацией
RUN if [ -f package-lock.json ]; then \
      npm ci --prefer-offline --no-audit --progress=false; \
    else \
      npm install --legacy-peer-deps --prefer-offline --no-audit --progress=false; \
    fi

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
