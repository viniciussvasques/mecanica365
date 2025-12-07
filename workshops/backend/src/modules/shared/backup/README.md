# 🔄 BackupModule - Sistema de Backup Automatizado

## 📋 Descrição

Módulo responsável pelo backup automatizado do banco de dados PostgreSQL, com suporte a criptografia AES-256, armazenamento local e S3, e restauração de backups.

## 🎯 Funcionalidades

### Backup Automatizado
- ✅ Backup diário completo (2:00 AM)
- ✅ Backup incremental a cada 6 horas
- ✅ Criptografia AES-256-GCM
- ✅ Armazenamento local e S3 (opcional)
- ✅ Retenção configurável (30 dias padrão)
- ✅ Limpeza automática de backups expirados

### Restauração
- ✅ Restauração de backups completos
- ✅ Validação de backups antes da restauração
- ✅ Suporte a backups criptografados

### Monitoramento
- ✅ Status dos backups
- ✅ Histórico de backups
- ✅ Notificações de falhas

## 📁 Estrutura

```
backup/
├── dto/
│   ├── backup-config.dto.ts
│   ├── backup-response.dto.ts
│   ├── backup-filters.dto.ts
│   ├── restore-request.dto.ts
│   └── index.ts
├── strategies/
│   ├── backup-strategy.interface.ts
│   ├── local-backup.strategy.ts
│   └── s3-backup.strategy.ts
├── utils/
│   └── encryption.util.ts
├── jobs/
│   ├── scheduled-backup.job.ts
│   ├── incremental-backup.job.ts
│   └── cleanup-expired-backups.job.ts
├── backup.service.ts
├── backup.controller.ts
├── backup.module.ts
└── README.md
```

## 🔌 Endpoints

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| `POST` | `/api/backup` | Criar backup manual | `admin` |
| `GET` | `/api/backup` | Listar backups | `admin`, `manager` |
| `GET` | `/api/backup/status` | Status dos backups | `admin`, `manager` |
| `GET` | `/api/backup/:id` | Obter backup por ID | `admin`, `manager` |
| `POST` | `/api/backup/:id/restore` | Restaurar backup | `admin` |
| `DELETE` | `/api/backup/:id` | Deletar backup | `admin` |

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Diretório de backups (padrão: ./backups)
BACKUP_DIR=./backups

# Chave de criptografia (padrão: usa JWT_SECRET)
BACKUP_ENCRYPTION_KEY=your-encryption-key-here

# S3 (opcional)
AWS_S3_BACKUP_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 📝 Exemplo de Uso

### Criar Backup Manual

```bash
POST /api/backup
{
  "type": "full",
  "encrypted": true,
  "retentionDays": 30
}
```

### Listar Backups

```bash
GET /api/backup?page=1&limit=20&type=full&status=success
```

### Restaurar Backup

```bash
POST /api/backup/{backupId}/restore
{
  "testRestore": false
}
```

## 🔐 Segurança

- **Criptografia**: AES-256-GCM com salt e IV únicos
- **Autenticação**: JWT obrigatório
- **Autorização**: Apenas `admin` pode criar/restaurar/deletar backups
- **Retenção**: Backups expirados são automaticamente deletados

## 🚀 Jobs Agendados

1. **Backup Diário Completo**: Todos os dias às 2:00 AM
2. **Backup Incremental**: A cada 6 horas
3. **Limpeza de Backups Expirados**: Todos os dias às 3:00 AM

## 📚 Dependências

- `@nestjs/schedule` - Jobs agendados
- `@prisma/client` - Acesso ao banco de dados
- `pg_dump` / `pg_restore` - Ferramentas PostgreSQL (devem estar no PATH)

## ⚠️ Requisitos

- PostgreSQL com `pg_dump` e `pg_restore` instalados
- Diretório de backups com permissões de escrita
- Para S3: Credenciais AWS configuradas

## 🔄 Próximos Passos

- [ ] Upload para S3 implementado completamente
- [ ] Testes de restauração automatizados
- [ ] Notificações de falhas de backup
- [ ] Métricas e monitoramento avançado

