FROM node:18-alpine AS builder

WORKDIR /app

# Копируем OpenSSL 1.1.x из alpine:3.16 образа
COPY --from=alpine:3.16 /usr/lib/libssl.so.1.1 /usr/lib/libssl.so.1.1
COPY --from=alpine:3.16 /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1

# Создаем символические ссылки для совместимости
RUN ln -sf /usr/lib/libssl.so.1.1 /usr/lib/libssl.so && \
    ln -sf /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so

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

# Prisma уже установлен через npm install выше
# Бинарники установятся при prisma generate

# Диагностика перед генерацией Prisma
RUN echo "=== DIAGNOSTICS ===" && \
    echo "OpenSSL libraries:" && \
    ls -la /usr/lib/libssl.so* /usr/lib/libcrypto.so* 2>/dev/null || echo "NOT FOUND" && \
    echo "LD_LIBRARY_PATH: $LD_LIBRARY_PATH" && \
    echo "Prisma engines dir:" && \
    ls -la node_modules/@prisma/engines/ 2>/dev/null || echo "NOT FOUND" && \
    echo "Prisma client dir:" && \
    ls -la node_modules/.prisma/ 2>/dev/null || echo "NOT FOUND" && \
    echo "=== END DIAGNOSTICS ==="

# Генерируем Prisma клиент (нужны все зависимости)
# Устанавливаем LD_LIBRARY_PATH для поиска OpenSSL
ENV LD_LIBRARY_PATH=/usr/lib:/lib:${LD_LIBRARY_PATH:-}
# Отключаем загрузку бинарников - используем установленные
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
# Генерируем с таймаутом на случай зависания
RUN timeout 300 npx prisma generate || npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Копируем OpenSSL 1.1.x из alpine:3.16 для runtime
COPY --from=alpine:3.16 /usr/lib/libssl.so.1.1 /usr/lib/libssl.so.1.1
COPY --from=alpine:3.16 /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1

# Создаем символические ссылки для совместимости
RUN ln -sf /usr/lib/libssl.so.1.1 /usr/lib/libssl.so && \
    ln -sf /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so

# Устанавливаем LD_LIBRARY_PATH для runtime
ENV LD_LIBRARY_PATH=/usr/lib:/lib:${LD_LIBRARY_PATH:-}


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
