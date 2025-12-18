#!/bin/bash

echo "🔧 Fixing pg_hba.conf to allow Docker network connections..."
echo ""

# Проверяем текущий pg_hba.conf
echo "1️⃣ Current pg_hba.conf rules:"
docker exec nardist_postgres_prod cat /var/lib/postgresql/data/pg_hba.conf | grep -v "^#" | grep -v "^$"

# Добавляем правило для Docker сети если его нет
echo ""
echo "2️⃣ Adding rule for Docker network (172.18.0.0/16)..."
docker exec nardist_postgres_prod sh -c "
  if ! grep -q '172.18.0.0/16' /var/lib/postgresql/data/pg_hba.conf; then
    echo 'host all all 172.18.0.0/16 md5' >> /var/lib/postgresql/data/pg_hba.conf
    echo '✅ Rule added'
  else
    echo '✅ Rule already exists'
  fi
"

# Перезагружаем конфигурацию
echo ""
echo "3️⃣ Reloading PostgreSQL configuration..."
docker exec nardist_postgres_prod psql -U nardist -d nardist_db -c "SELECT pg_reload_conf();" 2>&1

# Проверяем что правило добавлено
echo ""
echo "4️⃣ Updated pg_hba.conf rules:"
docker exec nardist_postgres_prod cat /var/lib/postgresql/data/pg_hba.conf | grep -v "^#" | grep -v "^$" | tail -5

echo ""
echo "✅ Fix completed! Now test connection again."

