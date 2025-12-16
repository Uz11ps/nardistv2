#!/bin/sh
set -e

# Запускаем генерацию Prisma - Prisma сама определит все настройки
npx prisma generate "$@"

