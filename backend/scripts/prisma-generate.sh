#!/bin/sh
set -e

# Добавляем путь к OpenSSL библиотекам в LD_LIBRARY_PATH для Ubuntu
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}

# Устанавливаем все зависимости если их нет (включая бинарники Prisma)
if [ ! -d "node_modules" ] || [ ! -d "node_modules/.prisma" ]; then
  echo "Installing dependencies and Prisma binaries..."
  npm install --legacy-peer-deps --no-audit
fi

# Проверяем наличие бинарников Prisma
if [ ! -d "node_modules/.prisma" ]; then
  echo "Prisma binaries not found, installing..."
  npm install prisma@5.20.0 @prisma/client@5.20.0 --save-dev --legacy-peer-deps --no-audit
fi

# Запускаем генерацию Prisma
npx prisma generate "$@"

