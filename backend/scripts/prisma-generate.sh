#!/bin/sh
set -e

# Добавляем путь к OpenSSL библиотекам в LD_LIBRARY_PATH для Ubuntu
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}

# Устанавливаем @prisma/client если его нет (чтобы бинарники были локально)
if [ ! -d "node_modules/@prisma/client" ]; then
  echo "Installing @prisma/client..."
  npm install @prisma/client@5.20.0 --legacy-peer-deps --no-audit
fi

# Запускаем генерацию Prisma - использует локальные бинарники
npx prisma generate "$@"

