#!/bin/bash
# Script profissional para resolver migration falhada
# Este script verifica o estado do banco, resolve problemas e aplica migrations de forma segura

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Fix Failed Migration - Professional${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Verificar se DATABASE_URL está configurado
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERRO: DATABASE_URL não configurado${NC}"
    echo -e "${YELLOW}Configure a variável de ambiente DATABASE_URL${NC}"
    exit 1
fi

# Extrair informações da URL do banco
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

echo -e "${GREEN}Conectando ao banco: ${DB_HOST}:${DB_PORT}/${DB_NAME}${NC}"
echo ""

# Verificar se o Prisma está instalado
if ! command -v npx &> /dev/null; then
    echo -e "${RED}ERRO: npx não encontrado. Instale Node.js${NC}"
    exit 1
fi

# Verificar estado da migration
echo -e "${YELLOW}1. Verificando estado das migrations...${NC}"
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "following migrations have failed"; then
    echo -e "   ${GREEN}✓ Migration falhada detectada${NC}"
    FAILED_MIGRATION="20241216000000_add_quotes_module"
else
    echo -e "   ${GREEN}✓ Nenhuma migration falhada detectada${NC}"
fi

echo ""

# Verificar se tabela quotes existe
echo -e "${YELLOW}2. Verificando estado do banco de dados...${NC}"

QUOTES_EXISTS=false
if command -v docker-compose &> /dev/null; then
    CHECK_RESULT=$(docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes')" 2>/dev/null || echo "f")
    if echo "$CHECK_RESULT" | grep -q "t"; then
        QUOTES_EXISTS=true
        echo -e "   ${GREEN}✓ Tabela 'quotes' existe${NC}"
    else
        echo -e "   ${YELLOW}✗ Tabela 'quotes' não existe${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠ Docker Compose não disponível. Assumindo que tabela não existe${NC}"
fi

echo ""

# Resolver migration falhada
echo -e "${YELLOW}3. Resolvendo migration falhada...${NC}"

if [ "$QUOTES_EXISTS" = true ]; then
    echo -e "   ${CYAN}→ Tabela existe. Marcando migration como aplicada...${NC}"
    if npx prisma migrate resolve --applied 20241216000000_add_quotes_module 2>&1; then
        echo -e "   ${GREEN}✓ Migration marcada como aplicada${NC}"
    else
        echo -e "   ${RED}✗ Erro ao marcar migration como aplicada${NC}"
        if [ "$1" != "--force" ]; then
            echo -e "   ${YELLOW}Use --force para continuar mesmo com erros${NC}"
            exit 1
        fi
    fi
else
    echo -e "   ${CYAN}→ Tabela não existe. Marcando migration como revertida...${NC}"
    if npx prisma migrate resolve --rolled-back 20241216000000_add_quotes_module 2>&1; then
        echo -e "   ${GREEN}✓ Migration marcada como revertida${NC}"
    else
        echo -e "   ${RED}✗ Erro ao marcar migration como revertida${NC}"
        if [ "$1" != "--force" ]; then
            exit 1
        fi
    fi
fi

echo ""

# Aplicar migrations
echo -e "${YELLOW}4. Aplicando migrations...${NC}"
if npx prisma migrate deploy; then
    echo -e "   ${GREEN}✓ Migrations aplicadas com sucesso${NC}"
else
    echo -e "   ${RED}✗ Erro ao aplicar migrations${NC}"
    exit 1
fi

echo ""

# Validar estado final
echo -e "${YELLOW}5. Validando estado final...${NC}"
FINAL_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$FINAL_STATUS" | grep -q "Database schema is up to date"; then
    echo -e "   ${GREEN}✓ Banco de dados está atualizado${NC}"
elif echo "$FINAL_STATUS" | grep -q "following migrations have failed"; then
    echo -e "   ${RED}✗ Ainda há migrations falhadas${NC}"
    echo -e "   ${YELLOW}Status: $FINAL_STATUS${NC}"
    exit 1
else
    echo -e "   ${YELLOW}⚠ Status: $FINAL_STATUS${NC}"
fi

echo ""

# Verificar integridade das tabelas
echo -e "${YELLOW}6. Verificando integridade das tabelas...${NC}"

TABLES_TO_CHECK=("quotes" "quote_items")
ALL_TABLES_EXIST=true

for table in "${TABLES_TO_CHECK[@]}"; do
    if command -v docker-compose &> /dev/null; then
        CHECK_RESULT=$(docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table')" 2>/dev/null || echo "f")
        if echo "$CHECK_RESULT" | grep -q "t"; then
            echo -e "   ${GREEN}✓ Tabela '$table' existe${NC}"
        else
            echo -e "   ${RED}✗ Tabela '$table' não existe${NC}"
            ALL_TABLES_EXIST=false
        fi
    else
        echo -e "   ${YELLOW}⚠ Não foi possível verificar tabela '$table'${NC}"
    fi
done

echo ""

# Resumo final
echo -e "${CYAN}========================================${NC}"
if [ "$ALL_TABLES_EXIST" = true ]; then
    echo -e "${GREEN}  ✓ Processo concluído com sucesso!${NC}"
else
    echo -e "${YELLOW}  ⚠ Processo concluído com avisos${NC}"
fi
echo -e "${CYAN}========================================${NC}"
echo ""

if [ "$ALL_TABLES_EXIST" = true ]; then
    echo -e "${CYAN}Próximos passos:${NC}"
    echo -e "  ${NC}1. Execute 'npx prisma generate' para atualizar o Prisma Client"
    echo -e "  ${NC}2. Execute os testes para validar: 'npm run test'"
    echo ""
    exit 0
else
    echo -e "${YELLOW}Atenção: Algumas tabelas não foram criadas.${NC}"
    echo -e "${YELLOW}Revise os logs acima e execute novamente se necessário.${NC}"
    exit 1
fi

