# 🤖 AutomationsModule - Automações e Workflows

## 📋 Descrição

Módulo responsável pela gestão de automações e workflows, permitindo configuração de regras de negócio via painel admin.

## 🎯 Funcionalidades

### CRUD de Automações
- ✅ Criar automação (configuração via admin)
- ✅ Listar automações
- ✅ Buscar automação por ID
- ✅ Atualizar automação
- ✅ Remover automação
- ✅ Executar automação manualmente (para testes)

### Triggers Disponíveis
- `quote.approved` - Quando orçamento é aprovado
- `service_order.completed` - Quando ordem de serviço é completada
- `invoice.issued` - Quando fatura é emitida
- `payment.received` - Quando pagamento é recebido
- `stock.low` - Quando estoque está baixo
- `appointment.scheduled` - Quando agendamento é criado
- `custom` - Trigger customizado

### Ações Disponíveis
- `send_email` - Enviar email
- `send_sms` - Enviar SMS
- `create_notification` - Criar notificação
- `create_job` - Criar job
- `update_status` - Atualizar status
- `custom` - Ação customizada

## 📁 Estrutura

```
automations/
├── dto/
│   ├── create-automation.dto.ts      # DTO para criação
│   ├── update-automation.dto.ts      # DTO para atualização
│   ├── automation-response.dto.ts    # DTO de resposta
│   └── index.ts
├── automations.controller.ts          # Controller REST
├── automations.service.ts             # Service com lógica de negócio
├── automations.module.ts              # Módulo NestJS
└── README.md
```

## 🔌 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/automations` | Criar nova automação |
| `GET` | `/api/automations` | Listar automações |
| `GET` | `/api/automations/:id` | Buscar automação por ID |
| `PATCH` | `/api/automations/:id` | Atualizar automação |
| `DELETE` | `/api/automations/:id` | Remover automação |
| `POST` | `/api/automations/:id/execute` | Executar automação manualmente |

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin` (apenas admin)

## 📝 Exemplo de Uso

### Criar Automação (via Painel Admin)

```typescript
POST /api/automations
{
  "name": "Notificar cliente quando orçamento é aprovado",
  "description": "Envia email ao cliente quando orçamento é aprovado",
  "trigger": "quote.approved",
  "action": "send_email",
  "conditions": {
    "quote.total": { "gt": 1000 }
  },
  "actionConfig": {
    "template": "quote-approved",
    "to": "{{customer.email}}",
    "subject": "Seu orçamento foi aprovado!"
  },
  "isActive": true
}
```

### Executar Automação Manualmente

```typescript
POST /api/automations/:id/execute
{
  "quoteId": "quote-123",
  "customerId": "customer-456"
}
```

## 🧪 Teste de Automação

O módulo permite executar automações manualmente para testes antes de ativá-las.

## 🚀 Próximos Passos

- [ ] Criar schema Prisma para Automation
- [ ] Implementar engine de execução de automações
- [ ] Implementar avaliação de condições
- [ ] Implementar variáveis dinâmicas ({{customer.email}})
- [ ] Dashboard de execuções de automações

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados

## ⚠️ Status Atual

**Estrutura básica implementada com endpoints para configuração via admin.**  
Para execução real, implementar engine de automações quando necessário.

