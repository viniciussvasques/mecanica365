# 💳 PaymentsModule - Gestão de Pagamentos

## 📋 Descrição

Módulo responsável pela gestão completa de pagamentos do sistema, incluindo registro, validação e controle de status de pagamentos vinculados a faturas.

## 🎯 Funcionalidades

### CRUD de Pagamentos
- ✅ Criar pagamento
- ✅ Listar pagamentos com filtros
- ✅ Buscar pagamento por ID
- ✅ Atualizar pagamento
- ✅ Remover pagamento

### Operações de Pagamento
- ✅ Validar valor do pagamento contra fatura
- ✅ Atualizar status da fatura automaticamente
- ✅ Suporte a múltiplos métodos de pagamento
- ✅ Controle de status de pagamento

### Integrações
- ✅ Integração com `InvoicingModule` (faturas)
- ✅ Integração com `FeatureFlagsModule` (controle de features)

## 📁 Estrutura

```
payments/
├── dto/
│   ├── create-payment.dto.ts      # DTO para criação
│   ├── update-payment.dto.ts      # DTO para atualização
│   ├── payment-response.dto.ts    # DTO de resposta
│   ├── payment-filters.dto.ts     # DTO para filtros
│   ├── payment-status.enum.ts    # Enum de status
│   ├── payment-method.enum.ts     # Enum de método
│   └── index.ts
├── payments.controller.ts          # Controller REST
├── payments.service.ts             # Service com lógica de negócio
├── payments.module.ts              # Módulo NestJS
└── payments.service.spec.ts        # Testes unitários
```

## 🔌 Endpoints

### Pagamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/payments` | Criar novo pagamento |
| `GET` | `/api/payments` | Listar pagamentos (com filtros) |
| `GET` | `/api/payments/:id` | Buscar pagamento por ID |
| `PATCH` | `/api/payments/:id` | Atualizar pagamento |
| `DELETE` | `/api/payments/:id` | Remover pagamento |

## 💰 Métodos de Pagamento

- `CASH` - Dinheiro
- `CREDIT_CARD` - Cartão de crédito
- `DEBIT_CARD` - Cartão de débito
- `PIX` - PIX
- `BANK_TRANSFER` - Transferência bancária
- `CHECK` - Cheque
- `OTHER` - Outro

## 📊 Status de Pagamento

- `PENDING` - Pendente
- `PAID` - Pago
- `CANCELLED` - Cancelado
- `REFUNDED` - Reembolsado

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin`, `manager`, `accountant`

## 📝 Exemplo de Uso

### Criar Pagamento

```typescript
POST /api/payments
{
  "invoiceId": "inv-123",
  "amount": 150.00,
  "method": "PIX",
  "paidAt": "2025-12-01T10:00:00Z"
}
```

### Listar Pagamentos com Filtros

```typescript
GET /api/payments?status=PAID&method=PIX&startDate=2025-12-01&endDate=2025-12-31
```

### Atualizar Pagamento

```typescript
PATCH /api/payments/:id
{
  "status": "PAID",
  "paidAt": "2025-12-01T10:00:00Z"
}
```

## 🧪 Testes

- ✅ Testes unitários implementados
- ✅ Cobertura: 85%+
- ✅ Testa CRUD completo
- ✅ Testa validações de valor
- ✅ Testa atualização de status de fatura

## 🔗 Integrações

### InvoicingModule
- Pagamentos podem ser vinculados a faturas
- Atualização automática de status da fatura quando paga
- Validação de valor do pagamento contra total da fatura

### FeatureFlagsModule
- Controle de features relacionadas a pagamentos
- Limites por plano de assinatura

## ⚠️ Regras de Negócio

1. **Validação de Valor:**
   - O valor do pagamento não pode exceder o total da fatura
   - A soma de todos os pagamentos não pode exceder o total da fatura
   - Validação automática ao criar/atualizar pagamento

2. **Atualização de Status:**
   - Quando pagamento é marcado como `PAID`, atualiza fatura para `PAID`
   - Quando todos os pagamentos somam o total da fatura, marca como paga
   - Quando pagamento é cancelado, recalcula status da fatura

3. **Remoção:**
   - Pagamentos `PAID` não podem ser removidos diretamente
   - Requer cancelamento antes da remoção

4. **Métodos de Pagamento:**
   - Suporte a múltiplos métodos
   - Validação de método válido

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados
- `@core/feature-flags/feature-flags.module` - Controle de features

## 🚀 Próximos Passos

- [ ] Integração com gateway de pagamento (Stripe, PagSeguro, etc.)
- [ ] Processamento de reembolsos
- [ ] Relatórios de pagamentos
- [ ] Notificações de pagamento
- [ ] Histórico de transações

