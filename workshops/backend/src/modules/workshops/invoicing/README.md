# 📄 InvoicingModule - Gestão de Faturas

## 📋 Descrição

Módulo responsável pela gestão completa de faturas (invoices) do sistema, incluindo criação, emissão, cancelamento e controle de status.

## 🎯 Funcionalidades

### CRUD de Faturas
- ✅ Criar fatura
- ✅ Listar faturas com filtros
- ✅ Buscar fatura por ID
- ✅ Atualizar fatura
- ✅ Remover fatura

### Operações de Fatura
- ✅ Emitir fatura
- ✅ Cancelar fatura
- ✅ Gerar número único de fatura (FAT-001, FAT-002, etc.)
- ✅ Calcular totais automaticamente
- ✅ Validar status antes de operações

### Integrações
- ✅ Integração com `ServiceOrdersModule` (ordens de serviço)
- ✅ Integração com `PaymentsModule` (pagamentos)
- ✅ Integração com `FeatureFlagsModule` (controle de features)

## 📁 Estrutura

```
invoicing/
├── dto/
│   ├── create-invoice.dto.ts      # DTO para criação
│   ├── update-invoice.dto.ts      # DTO para atualização
│   ├── invoice-response.dto.ts    # DTO de resposta
│   ├── invoice-filters.dto.ts      # DTO para filtros
│   ├── invoice-item.dto.ts        # DTO para itens da fatura
│   ├── invoice-status.enum.ts     # Enum de status
│   └── index.ts
├── invoicing.controller.ts        # Controller REST
├── invoicing.service.ts           # Service com lógica de negócio
├── invoicing.module.ts             # Módulo NestJS
└── invoicing.service.spec.ts       # Testes unitários
```

## 🔌 Endpoints

### Faturas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/invoicing` | Criar nova fatura |
| `GET` | `/api/invoicing` | Listar faturas (com filtros) |
| `GET` | `/api/invoicing/:id` | Buscar fatura por ID |
| `PATCH` | `/api/invoicing/:id` | Atualizar fatura |
| `DELETE` | `/api/invoicing/:id` | Remover fatura |
| `POST` | `/api/invoicing/:id/issue` | Emitir fatura |
| `POST` | `/api/invoicing/:id/cancel` | Cancelar fatura |

## 📊 Status de Fatura

- `DRAFT` - Rascunho (pode ser editada)
- `ISSUED` - Emitida (não pode ser editada)
- `PAID` - Paga (não pode ser cancelada)
- `CANCELLED` - Cancelada
- `OVERDUE` - Vencida

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin`, `manager`, `accountant`

## 📝 Exemplo de Uso

### Criar Fatura

```typescript
POST /api/invoicing
{
  "serviceOrderId": "so-123",
  "type": "SERVICE",
  "items": [
    {
      "description": "Troca de óleo",
      "quantity": 1,
      "unitPrice": 50.00
    }
  ],
  "dueDate": "2025-12-31"
}
```

### Emitir Fatura

```typescript
POST /api/invoicing/:id/issue
```

### Cancelar Fatura

```typescript
POST /api/invoicing/:id/cancel
{
  "reason": "Erro no cadastro"
}
```

## 🧪 Testes

- ✅ Testes unitários implementados
- ✅ Cobertura: 75%+
- ✅ Testa CRUD completo
- ✅ Testa validações de status
- ✅ Testa geração de número único

## 🔗 Integrações

### ServiceOrdersModule
- Faturas podem ser vinculadas a ordens de serviço
- Atualização automática de status quando OS é finalizada

### PaymentsModule
- Pagamentos podem ser vinculados a faturas
- Atualização automática de status quando fatura é paga

### FeatureFlagsModule
- Controle de features relacionadas a faturas
- Limites por plano de assinatura

## ⚠️ Regras de Negócio

1. **Emissão de Fatura:**
   - Apenas faturas em `DRAFT` podem ser emitidas
   - Após emitida, não pode ser editada
   - Gera número único automaticamente

2. **Cancelamento:**
   - Apenas faturas em `DRAFT` ou `ISSUED` podem ser canceladas
   - Faturas `PAID` não podem ser canceladas
   - Requer motivo do cancelamento

3. **Remoção:**
   - Apenas faturas em `DRAFT` podem ser removidas
   - Faturas emitidas ou pagas não podem ser removidas

4. **Cálculo de Totais:**
   - Total calculado automaticamente baseado nos itens
   - Suporta desconto e impostos

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados
- `@core/feature-flags/feature-flags.module` - Controle de features

## 🚀 Próximos Passos

- [ ] Integração com gateway de pagamento
- [ ] Geração de PDF de fatura
- [ ] Envio automático por email
- [ ] Notificações de vencimento
- [ ] Relatórios de faturamento

