#!/bin/sh
set -e

# Добавляем путь к OpenSSL библиотекам в LD_LIBRARY_PATH для Ubuntu
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}

# Запускаем генерацию Prisma - Prisma сама найдет библиотеки
npx prisma generate "$@"

