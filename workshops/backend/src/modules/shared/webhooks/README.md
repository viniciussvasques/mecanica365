# 🔗 WebhooksModule - Gestão de Webhooks

## 📋 Descrição

Módulo responsável pela gestão de webhooks para integrações externas, incluindo CRUD e disparo de eventos.

## 🎯 Funcionalidades

### CRUD de Webhooks
- ✅ Criar webhook
- ✅ Listar webhooks
- ✅ Buscar webhook por ID
- ✅ Atualizar webhook
- ✅ Remover webhook

### Disparo de Eventos
- ✅ Disparar webhook para eventos específicos
- ✅ Registro de tentativas de envio
- ✅ Histórico de tentativas

## 📁 Estrutura

```
webhooks/
├── dto/
│   ├── create-webhook.dto.ts      # DTO para criação
│   ├── update-webhook.dto.ts      # DTO para atualização
│   ├── webhook-response.dto.ts    # DTO de resposta
│   └── index.ts
├── webhooks.controller.ts          # Controller REST
├── webhooks.service.ts             # Service com lógica de negócio
├── webhooks.module.ts              # Módulo NestJS
└── webhooks.service.spec.ts        # Testes unitários
```

## 🔌 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/webhooks` | Criar novo webhook |
| `GET` | `/api/webhooks` | Listar webhooks |
| `GET` | `/api/webhooks/:id` | Buscar webhook por ID |
| `PATCH` | `/api/webhooks/:id` | Atualizar webhook |
| `DELETE` | `/api/webhooks/:id` | Remover webhook |

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin`, `manager`

## 📝 Exemplo de Uso

### Criar Webhook

```typescript
POST /api/webhooks
{
  "url": "https://example.com/webhook",
  "secret": "secret-key",
  "events": ["quote.approved", "service_order.completed"]
}
```

## 🧪 Testes

- ✅ Testes unitários implementados
- ✅ Cobertura: 100%

## 🚀 Próximos Passos

- [ ] Implementar envio real de webhook com HTTP
- [ ] Implementar retry automático
- [ ] Implementar assinatura HMAC
- [ ] Implementar fila de webhooks (Bull)

