#!/bin/sh
set -e

echo "🔧 Verificando Prisma Client..."

# Garantir que estamos no diretório correto
cd /app

# Verificar se o Prisma Client foi gerado corretamente
# O volume mount pode sobrescrever, então verificamos e regeneramos se necessário
if [ ! -f "/app/node_modules/.prisma/client/index.js" ]; then
  echo "🔨 Regenerando Prisma Client (volume mount pode ter sobrescrito)..."
  npx prisma generate --schema=./prisma/schema.prisma
  echo "✅ Prisma Client regenerado!"
else
  echo "✅ Prisma Client já está configurado!"
fi

# Executar comando original
exec "$@"

