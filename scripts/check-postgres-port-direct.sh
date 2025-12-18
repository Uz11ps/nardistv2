#!/bin/bash

echo "🔍 Checking PostgreSQL port 5432 directly..."
echo ""

POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Postgres IP: $POSTGRES_IP"
echo ""

# Проверяем из контейнера миграций
echo "1️⃣ Testing from migrations container..."
docker compose -f docker-compose.prod.yml --profile migrations run --rm migrations sh -c "
  echo 'Testing nc with different syntaxes...'
  echo ''
  echo 'Test 1: nc -w 2 postgres 5432'
  echo '' | nc -w 2 postgres 5432 2>&1 && echo '✅ Works' || echo '❌ Failed'
  echo ''
  echo 'Test 2: nc postgres 5432 < /dev/null'
  nc postgres 5432 < /dev/null 2>&1 && echo '✅ Works' || echo '❌ Failed'
  echo ''
  echo 'Test 3: telnet postgres 5432 (if available)'
  which telnet && (echo 'quit' | timeout 2 telnet postgres 5432 2>&1 | head -3) || echo 'telnet not available'
  echo ''
  echo 'Test 4: Checking if postgres is listening from inside postgres container...'
" 2>&1

echo ""
echo "2️⃣ Checking from postgres container itself..."
docker exec nardist_postgres_prod sh -c "
  echo 'Testing connection to itself...'
  pg_isready -h 172.18.0.3 -U nardist 2>&1
  echo ''
  echo 'Testing with psql...'
  psql -h 172.18.0.3 -U nardist -d nardist_db -c 'SELECT 1;' 2>&1 | head -3
" 2>&1

echo ""
echo "✅ Check completed!"

