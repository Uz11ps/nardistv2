#!/bin/sh
set -e

# Добавляем путь к OpenSSL библиотекам в LD_LIBRARY_PATH для Ubuntu
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}

# Устанавливаем все зависимости (включая бинарники Prisma)
if [ ! -d "node_modules" ]; then
  echo "Installing all dependencies..."
  npm install --legacy-peer-deps --no-audit
fi

# Проверяем наличие бинарников Prisma в engines
if [ ! -d "node_modules/@prisma/engines" ]; then
  echo "Prisma engines not found, installing prisma package..."
  npm install prisma@5.20.0 --save-dev --legacy-peer-deps --no-audit --force
fi

# Отключаем загрузку бинарников - используем только локальные
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
export PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Запускаем генерацию Prisma
# Используем --skip-download если бинарники уже есть
if [ -d "node_modules/@prisma/engines" ]; then
  npx prisma generate "$@" --skip-download 2>/dev/null || npx prisma generate "$@"
else
  npx prisma generate "$@"
fi

