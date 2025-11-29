#!/bin/bash

# Script automatizado para setup completo do banco de dados
# Inclui: migrations, seeds e validações

set -e

echo "🚀 Iniciando setup do banco de dados..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se Docker está rodando
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker primeiro.${NC}"
    exit 1
fi

# Verificar se containers estão rodando
if ! docker-compose ps | grep -q "mecanica365-workshops-postgres.*Up"; then
    echo -e "${YELLOW}⚠️  Container do PostgreSQL não está rodando. Iniciando...${NC}"
    docker-compose up -d postgres
    echo "⏳ Aguardando PostgreSQL iniciar..."
    sleep 5
fi

echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"

# Aplicar migrations
echo -e "\n${YELLOW}📦 Aplicando migrations...${NC}"
docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db < prisma/migrations/20241216000000_add_quotes_module/migration_complete.sql
docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db < prisma/migrations/20241229000000_add_problem_diagnosis_fields/migration_partial.sql

echo -e "${GREEN}✅ Migrations aplicadas${NC}"

# Executar seed de problemas comuns
echo -e "\n${YELLOW}🌱 Executando seed de problemas comuns...${NC}"
docker-compose exec backend npx ts-node prisma/seeds/index.ts

echo -e "${GREEN}✅ Seed executado${NC}"

# Validar setup
echo -e "\n${YELLOW}🔍 Validando setup...${NC}"

# Verificar se tabelas existem
TABLES=("quotes" "quote_items" "service_orders" "common_problems")
for table in "${TABLES[@]}"; do
    if docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db -c "\d $table" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Tabela $table existe${NC}"
    else
        echo -e "${RED}❌ Tabela $table não existe${NC}"
    fi
done

# Verificar se problemas comuns foram criados
PROBLEM_COUNT=$(docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM common_problems;" | tr -d ' ')
if [ "$PROBLEM_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ $PROBLEM_COUNT problemas comuns cadastrados${NC}"
else
    echo -e "${YELLOW}⚠️  Nenhum problema comum encontrado${NC}"
fi

echo -e "\n${GREEN}🎉 Setup do banco de dados concluído!${NC}"

