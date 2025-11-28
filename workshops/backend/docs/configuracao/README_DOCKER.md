# Docker Setup - Mecânica365 Backend

Este documento descreve como configurar e executar o backend usando Docker.

---

## 🚀 Quick Start

### Desenvolvimento

```bash
# 1. Copiar arquivo de ambiente
cp env.example .env

# 2. Editar .env com suas configurações (opcional)

# 3. IMPORTANTE: Gerar Prisma Client localmente primeiro
npm install
npm run prisma:generate

# 4. Subir todos os serviços (PostgreSQL, Redis, Backend)
docker-compose up -d

# 5. Ver logs
docker-compose logs -f backend

# 6. Executar migrations
docker-compose exec backend npx prisma migrate dev

# 7. Executar seeds (se houver)
docker-compose exec backend npm run seed
```

**Nota:** O Prisma Client deve ser gerado localmente antes de subir o Docker porque o volume mount sobrescreve os `node_modules` do container. O script de entrada do Docker tentará gerar novamente, mas é melhor ter localmente primeiro.

### Produção

```bash
# 1. Configurar variáveis de ambiente
# Criar arquivo .env.prod com todas as variáveis necessárias

# 2. Subir serviços de produção
docker-compose -f docker-compose.prod.yml up -d

# 3. Executar migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## 📋 Comandos Úteis

### Desenvolvimento

```bash
# Subir serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker-compose down -v

# Ver logs
docker-compose logs -f [service_name]

# Executar comando no container
docker-compose exec backend [comando]

# Rebuild da imagem
docker-compose build backend

# Acessar PostgreSQL
docker-compose exec postgres psql -U ${POSTGRES_USER:-mecanica365} -d ${POSTGRES_DB:-mecanica365_db}

# Acessar Redis CLI
docker-compose exec redis redis-cli
```

### Produção

```bash
# Subir serviços
docker-compose -f docker-compose.prod.yml up -d

# Parar serviços
docker-compose -f docker-compose.prod.yml down

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Backup do PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup.sql

# Restore do PostgreSQL
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB} < backup.sql
```

---

## 🗄️ PostgreSQL - Configurações Robustas

O PostgreSQL está configurado com otimizações para performance:

### Configurações Aplicadas

- **max_connections**: 200 conexões simultâneas
- **shared_buffers**: 256MB (dev) / 512MB (prod)
- **effective_cache_size**: 1GB (dev) / 2GB (prod)
- **work_mem**: 4MB (dev) / 8MB (prod)
- **maintenance_work_mem**: 64MB (dev) / 128MB (prod)
- **max_parallel_workers**: 4 (dev) / 8 (prod)
- **WAL**: Configurado para alta performance

### Health Check

O PostgreSQL possui health check configurado que verifica:
- Conexão ativa
- Banco de dados acessível
- Intervalo: 10s

---

## 🔴 Redis - Configuração

### Desenvolvimento
- **maxmemory**: 256MB
- **policy**: allkeys-lru
- **appendonly**: yes (persistência)

### Produção
- **maxmemory**: 512MB
- **policy**: allkeys-lru
- **appendonly**: yes
- **password**: Configurável via REDIS_PASSWORD

---

## 🔧 Variáveis de Ambiente

### Obrigatórias

```env
POSTGRES_USER=mecanica365
POSTGRES_PASSWORD=senha_segura
POSTGRES_DB=mecanica365_db
JWT_SECRET=chave-secreta-min-32-caracteres
```

### Opcionais

```env
PORT=3001
NODE_ENV=development
REDIS_PASSWORD=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🐛 Troubleshooting

### Backend não conecta ao PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs do PostgreSQL
docker-compose logs postgres

# Verificar health check
docker-compose exec postgres pg_isready -U mecanica365
```

### Backend não conecta ao Redis

```bash
# Verificar se Redis está rodando
docker-compose ps redis

# Testar conexão
docker-compose exec redis redis-cli ping
```

### Erro de permissão no Prisma

```bash
# Gerar Prisma Client novamente
docker-compose exec backend npx prisma generate

# Executar migrations
docker-compose exec backend npx prisma migrate dev
```

### Limpar tudo e começar do zero

```bash
# CUIDADO: Isso apaga TODOS os dados!
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate dev
```

---

## 📊 Monitoramento

### Health Checks

Todos os serviços possuem health checks configurados:

- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **Backend**: `GET /api/health`

### Verificar status

```bash
docker-compose ps
```

---

## 🔒 Segurança

### Desenvolvimento
- Senhas padrão (alterar em produção!)
- Sem SSL/TLS entre containers

### Produção
- Use senhas fortes
- Configure SSL/TLS
- Use secrets management (Docker Secrets, Vault, etc.)
- Configure firewall
- Limite acesso às portas

---

## 📝 Notas

- Os volumes são persistentes, então dados não são perdidos ao reiniciar containers
- Para desenvolvimento, o código é montado como volume (hot reload)
- Para produção, o código é copiado para a imagem (otimizado)

---

**Última atualização:** 2024

