# 🚀 Scripts de Automação

Scripts para facilitar o setup e manutenção do banco de dados.

## 📋 Scripts Disponíveis

### `setup-database.ps1` (PowerShell) / `setup-database.sh` (Bash)

Script completo para setup automatizado do banco de dados.

**O que faz:**
- ✅ Verifica se Docker está rodando
- ✅ Inicia PostgreSQL se necessário
- ✅ Aplica todas as migrations necessárias
- ✅ Executa seed de problemas comuns
- ✅ Valida o setup (verifica tabelas e dados)

**Como usar:**

```powershell
# Windows (PowerShell)
npm run db:setup

# Ou diretamente
.\scripts\setup-database.ps1
```

```bash
# Linux/Mac (Bash)
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

### `npm run db:seed`

Executa apenas o seed de problemas comuns.

```bash
npm run db:seed
```

## 📦 O que é criado

### Migrations Aplicadas
- ✅ Tabela `quotes` com todos os campos de diagnóstico
- ✅ Tabela `quote_items`
- ✅ Campos de problema relatado/identificado em `service_orders`
- ✅ Campos `symptoms` e `solutions` em `common_problems`
- ✅ Todos os índices e foreign keys

### Seeds Executados
- ✅ 19 problemas comuns pré-definidos:
  - Motor (óleo baixo, superaquecimento, ruído)
  - Freios (pastilhas, discos, fluido)
  - Suspensão (amortecedor, bieleta)
  - Elétrica/Bateria (bateria fraca, alternador, fusível)
  - Ar condicionado (sem gás, compressor)
  - Pneus (desgastados, furado)
  - Transmissão, Refrigeração, Direção

## 🔍 Validação

O script valida automaticamente:
- ✅ Existência das tabelas principais
- ✅ Quantidade de problemas comuns cadastrados
- ✅ Estrutura do banco de dados

## ⚠️ Requisitos

- Docker e Docker Compose instalados
- Containers do projeto rodando (`docker-compose up -d`)
- Variáveis de ambiente configuradas (`.env`)

## 🐛 Troubleshooting

### Erro: "Docker não está rodando"
```bash
# Inicie o Docker Desktop ou Docker daemon
docker ps
```

### Erro: "Container não está rodando"
```bash
# Inicie os containers
docker-compose up -d
```

### Erro: "Tabela já existe"
O script é idempotente - pode ser executado múltiplas vezes sem problemas. Se uma tabela já existe, ela não será recriada.

### Erro: "Prisma Client desatualizado"
```bash
# Regenerar Prisma Client
docker-compose exec backend npx prisma generate
```

---

**Última atualização:** Dezembro 2024
