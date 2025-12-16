#!/bin/sh
set -e

# Ищем OpenSSL библиотеки в стандартных местах Ubuntu/Debian
# Приоритет: /lib/x86_64-linux-gnu/ (стандартное место в Ubuntu)
SSL_PATHS=(
  "/lib/x86_64-linux-gnu/libssl.so.3"
  "/lib/x86_64-linux-gnu/libssl.so.1.1"
  "/usr/lib/x86_64-linux-gnu/libssl.so.3"
  "/usr/lib/x86_64-linux-gnu/libssl.so.1.1"
  "/usr/lib/libssl.so.3"
  "/usr/lib/libssl.so.1.1"
  "/lib/libssl.so.3"
  "/lib/libssl.so.1.1"
)

CRYPTO_PATHS=(
  "/lib/x86_64-linux-gnu/libcrypto.so.3"
  "/lib/x86_64-linux-gnu/libcrypto.so.1.1"
  "/usr/lib/x86_64-linux-gnu/libcrypto.so.3"
  "/usr/lib/x86_64-linux-gnu/libcrypto.so.1.1"
  "/usr/lib/libcrypto.so.3"
  "/usr/lib/libcrypto.so.1.1"
  "/lib/libcrypto.so.3"
  "/lib/libcrypto.so.1.1"
)

# Ищем через find как fallback (приоритет /lib/x86_64-linux-gnu/ для Ubuntu, /usr/lib для Alpine)
SSL_PATH=$(find /lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu /usr/lib /lib -name "libssl.so*" 2>/dev/null | head -1)
CRYPTO_PATH=$(find /lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu /usr/lib /lib -name "libcrypto.so*" 2>/dev/null | head -1)

# Проверяем стандартные пути
for path in "${SSL_PATHS[@]}"; do
  if [ -f "$path" ]; then
    SSL_PATH="$path"
    break
  fi
done

for path in "${CRYPTO_PATHS[@]}"; do
  if [ -f "$path" ]; then
    CRYPTO_PATH="$path"
    break
  fi
done

if [ -n "$SSL_PATH" ] && [ -f "$SSL_PATH" ]; then
  export PRISMA_OPENSSL_LIBRARY="$SSL_PATH"
  echo "Found OpenSSL library: $SSL_PATH"
else
  echo "Warning: OpenSSL library not found, Prisma may fail"
fi

if [ -n "$CRYPTO_PATH" ] && [ -f "$CRYPTO_PATH" ]; then
  export PRISMA_OPENSSL_LIBRARY_CRYPTO="$CRYPTO_PATH"
  echo "Found Crypto library: $CRYPTO_PATH"
else
  echo "Warning: Crypto library not found, Prisma may fail"
fi

# Устанавливаем LD_LIBRARY_PATH для поиска библиотек
if [ -n "$SSL_PATH" ]; then
  SSL_DIR=$(dirname "$SSL_PATH")
  export LD_LIBRARY_PATH="$SSL_DIR:${LD_LIBRARY_PATH:-}"
fi

# Запускаем генерацию Prisma
npx prisma generate "$@"

