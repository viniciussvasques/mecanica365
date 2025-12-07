#!/bin/sh
set -e

echo "🔧 Verificando dependências..."

# Garantir que estamos no diretório correto
cd /app

# Verificar se axios está instalado (volume mount pode sobrescrever node_modules)
if [ ! -d "/app/node_modules/axios" ]; then
  echo "📦 Instalando dependências (axios não encontrado)..."
  npm install
  echo "✅ Dependências instaladas!"
fi

# Verificar se o Prisma Client foi gerado corretamente
# O volume mount pode sobrescrever, então verificamos e regeneramos se necessário
if [ ! -f "/app/node_modules/.prisma/client/index.js" ]; then
  echo "🔨 Regenerando Prisma Client (volume mount pode ter sobrescrito)..."
  npx prisma generate --schema=./prisma/schema.prisma
  echo "✅ Prisma Client regenerado!"
else
  # Sempre regenerar para garantir que está atualizado com o schema mais recente
  echo "🔨 Regenerando Prisma Client para garantir tipos atualizados..."
  npx prisma generate --schema=./prisma/schema.prisma
  echo "✅ Prisma Client atualizado!"
fi

# Verificar se @nestjs/schedule está instalado
if [ ! -d "/app/node_modules/@nestjs/schedule" ]; then
  echo "📦 Instalando @nestjs/schedule..."
  npm install @nestjs/schedule
  echo "✅ @nestjs/schedule instalado!"
fi

# Executar comando original
exec "$@"

