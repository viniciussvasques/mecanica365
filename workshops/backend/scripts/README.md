# Scripts de Automação - Mecânica365 Backend

Este diretório contém scripts automatizados para gerenciamento do banco de dados e operações de desenvolvimento.

## 📋 Scripts Disponíveis

### 1. Setup do Banco de Dados

#### `setup-database.ps1` / `setup-database.sh`
Script completo para configuração inicial do banco de dados.

**Funcionalidades:**
- Verifica se Docker está rodando
- Inicia containers se necessário
- Aplica todas as migrations
- Executa seeds (dados iniciais)
- Valida integridade das tabelas

**Uso:**
```bash
# Windows (PowerShell)
npm run db:setup

# Linux/Mac (Bash)
./scripts/setup-database.sh
```

---

### 2. Fix de Migration Falhada ⚠️

#### `fix-failed-migration.ps1` / `fix-failed-migration.sh`
**Script profissional para resolver migrations que falharam durante o deploy.**

Este script é especialmente útil quando uma migration falha devido a:
- Tabelas referenciadas não existirem
- Foreign keys quebradas
- Problemas de conectividade
- Estados inconsistentes do banco

**Funcionalidades:**
1. ✅ Verifica estado atual das migrations
2. ✅ Detecta migrations falhadas
3. ✅ Verifica existência de tabelas no banco
4. ✅ Resolve estado da migration (aplicada/revertida)
5. ✅ Aplica todas as migrations pendentes
6. ✅ Valida integridade final
7. ✅ Verifica existência de todas as tabelas necessárias

**Uso:**
```bash
# Windows (PowerShell)
npm run db:fix-migration

# Com flag de força (ignora alguns erros)
npm run db:fix-migration:force

# Linux/Mac (Bash)
./scripts/fix-failed-migration.sh

# Com flag de força
./scripts/fix-failed-migration.sh --force
```

**Exemplo de Output:**
```
========================================
  Fix Failed Migration - Professional
========================================

Conectando ao banco: postgres:5432/mecanica365_db

1. Verificando estado das migrations...
   ✓ Migration falhada detectada

2. Verificando estado do banco de dados...
   ✓ Tabela 'quotes' existe

3. Resolvendo migration falhada...
   → Tabela existe. Marcando migration como aplicada...
   ✓ Migration marcada como aplicada

4. Aplicando migrations...
   ✓ Migrations aplicadas com sucesso

5. Validando estado final...
   ✓ Banco de dados está atualizado

6. Verificando integridade das tabelas...
   ✓ Tabela 'quotes' existe
   ✓ Tabela 'quote_items' existe

========================================
  ✓ Processo concluído com sucesso!
========================================

Próximos passos:
  1. Execute 'npx prisma generate' para atualizar o Prisma Client
  2. Execute os testes para validar: 'npm run test'
```

---

## 🔧 Requisitos

### Para Windows:
- PowerShell 5.1 ou superior
- Docker Desktop
- Node.js e npm

### Para Linux/Mac:
- Bash 4.0 ou superior
- Docker e Docker Compose
- Node.js e npm

---

## 📝 Variáveis de Ambiente

Os scripts utilizam a variável `DATABASE_URL` do arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@host:porta/database"
```

---

## 🚨 Troubleshooting

### Erro: "Can't reach database server"
**Solução:** Verifique se o Docker está rodando e se os containers estão ativos:
```bash
docker-compose ps
docker-compose up -d postgres
```

### Erro: "Migration failed to apply"
**Solução:** Execute o script de fix:
```bash
npm run db:fix-migration
```

### Erro: "relation does not exist"
**Solução:** A migration foi corrigida para verificar existência de tabelas antes de criar foreign keys. Execute:
```bash
npm run db:fix-migration
```

### Erro: "Permission denied" (Linux/Mac)
**Solução:** Dê permissão de execução:
```bash
chmod +x scripts/*.sh
```

---

## 🔄 Fluxo de Trabalho Recomendado

### Desenvolvimento Local:
1. `npm run db:setup` - Setup inicial completo
2. Desenvolver features
3. `npm run prisma:migrate` - Criar nova migration
4. `npm run test` - Validar mudanças

### Deploy em Produção:
1. `npm run db:fix-migration` - Resolver qualquer problema
2. `npm run docker:migrate:deploy` - Aplicar migrations
3. `npm run docker:prisma:generate` - Atualizar Prisma Client
4. Validar aplicação

### Após Migration Falhar:
1. **NÃO** tente aplicar migrations manualmente
2. Execute `npm run db:fix-migration`
3. O script detectará e resolverá automaticamente
4. Valide com `npm run test`

---

## 📚 Documentação Adicional

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/docs/)

---

## ⚡ Dicas Profissionais

1. **Sempre execute o fix-migration após uma falha** - Não tente resolver manualmente
2. **Use --force apenas em emergências** - Pode mascarar problemas reais
3. **Valide sempre após o fix** - Execute testes e verifique logs
4. **Mantenha backups** - Antes de executar migrations em produção
5. **Documente mudanças** - Anote qualquer ajuste manual necessário

---

## 🆘 Suporte

Se encontrar problemas não cobertos nesta documentação:
1. Verifique os logs: `docker-compose logs postgres`
2. Verifique status: `npx prisma migrate status`
3. Consulte a documentação do Prisma
4. Abra uma issue no repositório
