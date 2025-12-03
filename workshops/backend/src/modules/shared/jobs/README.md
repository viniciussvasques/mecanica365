# ⚙️ JobsModule - Processamento Assíncrono

## 📋 Descrição

Módulo responsável pelo processamento assíncrono de tarefas (jobs) em background.

## 🎯 Funcionalidades

### Gerenciamento de Jobs
- ✅ Criar job
- ✅ Listar jobs com filtros
- ✅ Processar jobs em background

### Tipos de Jobs Suportados
- `EMAIL` - Envio de emails
- `REPORT` - Geração de relatórios
- `WEBHOOK` - Envio de webhooks
- `CLEANUP` - Limpeza de dados
- `EXPORT` - Exportação de dados

## 📁 Estrutura

```
jobs/
├── dto/
│   ├── create-job.dto.ts          # DTO para criação
│   ├── job-response.dto.ts        # DTO de resposta
│   ├── job-filters.dto.ts         # DTO para filtros
│   └── index.ts
├── jobs.controller.ts              # Controller REST
├── jobs.service.ts                 # Service com lógica de negócio
├── jobs.module.ts                  # Módulo NestJS
└── README.md
```

## 🔌 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/jobs` | Criar novo job |
| `GET` | `/api/jobs` | Listar jobs (com filtros) |

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin`, `manager`

## 📝 Exemplo de Uso

### Criar Job

```typescript
POST /api/jobs
{
  "type": "EMAIL",
  "data": {
    "to": "cliente@email.com",
    "subject": "Orçamento aprovado",
    "template": "quote-approved"
  },
  "priority": 5,
  "attempts": 3
}
```

## 🚀 Próximos Passos

- [ ] Implementar Bull + Redis para processamento assíncrono real
- [ ] Criar schema Prisma para Job
- [ ] Implementar processadores de fila
- [ ] Implementar retry automático
- [ ] Implementar monitoramento de jobs

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados

## ⚠️ Status Atual

**Estrutura básica implementada.**  
Para processamento assíncrono real, instalar Bull:
```bash
npm install @nestjs/bull bull
```

