#!/bin/bash

echo "🔍 Checking why migrations container cannot connect..."
echo ""

# Запускаем контейнер миграций и проверяем изнутри
echo "1️⃣ Starting migrations container and checking from inside..."
docker compose -f docker-compose.prod.yml --profile migrations run --rm migrations sh -c "
  echo 'Checking DNS...'
  getent hosts postgres
  echo ''
  echo 'Checking ping...'
  ping -c 1 postgres
  echo ''
  echo 'Checking nc connection...'
  echo '' | nc -w 2 postgres 5432 && echo '✅ nc works' || echo '❌ nc failed'
  echo ''
  echo 'Checking with timeout...'
  timeout 2 sh -c 'echo | nc postgres 5432' && echo '✅ timeout nc works' || echo '❌ timeout nc failed'
" 2>&1

echo ""
echo "✅ Check completed!"

