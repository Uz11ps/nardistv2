#!/bin/sh
set -e

# Запускаем генерацию Prisma
npx prisma generate "$@"

