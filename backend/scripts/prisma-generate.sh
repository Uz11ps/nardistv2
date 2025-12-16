#!/bin/sh
set -e

# Ищем OpenSSL библиотеки в стандартных местах (Alpine/Ubuntu)
# Используем find для поиска, приоритет: /lib/x86_64-linux-gnu/ для Ubuntu, /usr/lib для Alpine
SSL_PATH=$(find /lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu /usr/lib /lib -name "libssl.so*" 2>/dev/null | head -1)
CRYPTO_PATH=$(find /lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu /usr/lib /lib -name "libcrypto.so*" 2>/dev/null | head -1)

# Если не нашли через find, проверяем стандартные пути вручную
if [ -z "$SSL_PATH" ]; then
  if [ -f "/lib/x86_64-linux-gnu/libssl.so.3" ]; then
    SSL_PATH="/lib/x86_64-linux-gnu/libssl.so.3"
  elif [ -f "/usr/lib/libssl.so.3" ]; then
    SSL_PATH="/usr/lib/libssl.so.3"
  elif [ -f "/lib/libssl.so.3" ]; then
    SSL_PATH="/lib/libssl.so.3"
  elif [ -f "/usr/lib/libssl.so.1.1" ]; then
    SSL_PATH="/usr/lib/libssl.so.1.1"
  fi
fi

if [ -z "$CRYPTO_PATH" ]; then
  if [ -f "/lib/x86_64-linux-gnu/libcrypto.so.3" ]; then
    CRYPTO_PATH="/lib/x86_64-linux-gnu/libcrypto.so.3"
  elif [ -f "/usr/lib/libcrypto.so.3" ]; then
    CRYPTO_PATH="/usr/lib/libcrypto.so.3"
  elif [ -f "/lib/libcrypto.so.3" ]; then
    CRYPTO_PATH="/lib/libcrypto.so.3"
  elif [ -f "/usr/lib/libcrypto.so.1.1" ]; then
    CRYPTO_PATH="/usr/lib/libcrypto.so.1.1"
  fi
fi

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

# Явно указываем версию OpenSSL для Prisma (3.0.x если нашли .so.3, иначе 1.1.x)
if echo "$SSL_PATH" | grep -q "\.so\.3"; then
  export PRISMA_OPENSSL_VERSION="3.0.x"
  echo "Detected OpenSSL 3.0.x"
else
  export PRISMA_OPENSSL_VERSION="1.1.x"
  echo "Detected OpenSSL 1.1.x"
fi

# Запускаем генерацию Prisma с явным указанием binaryTarget
npx prisma generate "$@"

