#!/bin/bash

# Script de setup inicial do Docker
# Uso: ./scripts/docker-setup.sh

set -e

echo "🚀 Configurando Docker para Mecânica365 Backend..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo "📝 Copiando arquivo de ambiente..."
    cp env.example .env
    echo "✅ Arquivo .env criado. Por favor, edite com suas configurações."
else
    echo "ℹ️  Arquivo .env já existe."
fi

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker-compose build

# Subir containers
echo "⬆️  Subindo containers..."
docker-compose up -d

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 5

# Verificar se PostgreSQL está saudável
until docker-compose exec -T postgres pg_isready -U ${POSTGRES_USER:-mecanica365} > /dev/null 2>&1; do
    echo "⏳ Aguardando PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL está pronto!"

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
docker-compose exec -T backend npx prisma generate --schema=./prisma/schema.prisma || echo "⚠️  Erro ao gerar Prisma Client. Execute manualmente: npm run docker:prisma:generate"

# Executar migrations
echo "📦 Executando migrations..."
docker-compose exec -T backend npx prisma migrate dev --schema=./prisma/schema.prisma || echo "⚠️  Erro ao executar migrations. Execute manualmente: npm run docker:migrate"

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📊 Status dos containers:"
docker-compose ps
echo ""
echo "📝 Próximos passos:"
echo "  - Ver logs: npm run docker:logs"
echo "  - Acessar API: http://localhost:3001"
echo "  - Swagger: http://localhost:3001/api/docs"
echo "  - Health check: http://localhost:3001/api/health"
echo ""

