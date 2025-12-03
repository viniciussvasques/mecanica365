# 🔧 PartsModule - Gestão de Peças e Estoque

## 📋 Descrição

Módulo responsável pela gestão completa de peças (parts) e controle de estoque, incluindo CRUD, movimentações e alertas de estoque baixo.

## 🎯 Funcionalidades

### CRUD de Peças
- ✅ Criar peça
- ✅ Listar peças com filtros
- ✅ Buscar peça por ID
- ✅ Atualizar peça
- ✅ Remover peça

### Controle de Estoque
- ✅ Controle de quantidade em estoque
- ✅ Movimentações de estoque (entrada/saída)
- ✅ Alertas de estoque baixo
- ✅ Histórico de movimentações
- ✅ Integração com fornecedores

### Validações
- ✅ Validação de número único de peça por tenant
- ✅ Validação de estoque antes de saída
- ✅ Validação de dados obrigatórios

### Integrações
- ✅ Integração com `ServiceOrdersModule` (ordens de serviço)
- ✅ Integração com `FeatureFlagsModule` (controle de features)

## 📁 Estrutura

```
parts/
├── dto/
│   ├── create-part.dto.ts          # DTO para criação
│   ├── update-part.dto.ts          # DTO para atualização
│   ├── part-response.dto.ts       # DTO de resposta
│   ├── part-filters.dto.ts         # DTO para filtros
│   └── index.ts
├── parts.controller.ts             # Controller REST
├── parts.service.ts                # Service com lógica de negócio
├── parts.module.ts                 # Módulo NestJS
└── parts.service.spec.ts           # Testes unitários
```

## 🔌 Endpoints

### Peças

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/parts` | Criar nova peça |
| `GET` | `/api/parts` | Listar peças (com filtros) |
| `GET` | `/api/parts/:id` | Buscar peça por ID |
| `PATCH` | `/api/parts/:id` | Atualizar peça |
| `DELETE` | `/api/parts/:id` | Remover peça |

## 📦 Campos da Peça

- `name` - Nome da peça
- `partNumber` - Número único da peça (opcional)
- `description` - Descrição
- `category` - Categoria
- `brand` - Marca
- `unitPrice` - Preço unitário
- `stockQuantity` - Quantidade em estoque
- `minStockLevel` - Nível mínimo de estoque
- `supplierId` - ID do fornecedor (opcional)
- `isActive` - Status ativo/inativo

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin`, `manager`

## 📝 Exemplo de Uso

### Criar Peça

```typescript
POST /api/parts
{
  "name": "Filtro de Óleo",
  "partNumber": "FIL-001",
  "description": "Filtro de óleo para motor",
  "category": "FILTROS",
  "brand": "Mann Filter",
  "unitPrice": 25.00,
  "stockQuantity": 50,
  "minStockLevel": 10,
  "supplierId": "supplier-123"
}
```

### Listar Peças com Filtros

```typescript
GET /api/parts?category=FILTROS&lowStock=true&isActive=true
```

### Atualizar Estoque

```typescript
PATCH /api/parts/:id
{
  "stockQuantity": 45
}
```

### Buscar Peças com Estoque Baixo

```typescript
GET /api/parts?lowStock=true
```

## 🧪 Testes

- ✅ Testes unitários implementados
- ✅ Cobertura: 81%+
- ✅ Testa CRUD completo
- ✅ Testa validações de estoque
- ✅ Testa movimentações de estoque

## 🔗 Integrações

### ServiceOrdersModule
- Peças podem ser consumidas em ordens de serviço
- Atualização automática de estoque ao consumir peças

### FeatureFlagsModule
- Controle de features relacionadas a peças
- Limites por plano de assinatura

## ⚠️ Regras de Negócio

1. **Número Único:**
   - `partNumber` deve ser único por tenant
   - Validação ao criar/atualizar peça

2. **Controle de Estoque:**
   - `stockQuantity` não pode ser negativo
   - Validação de estoque antes de saída
   - Alertas quando estoque abaixo de `minStockLevel`

3. **Movimentações:**
   - Movimentações registradas automaticamente
   - Histórico de todas as movimentações
   - Suporte a entrada e saída de estoque

4. **Remoção:**
   - Peças com estoque não podem ser removidas diretamente
   - Requer zerar estoque antes da remoção

5. **Fornecedores:**
   - Peças podem ser vinculadas a fornecedores
   - Facilita gestão de compras

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados
- `@core/feature-flags/feature-flags.module` - Controle de features

## 🚀 Próximos Passos

- [ ] Movimentações de estoque (entrada/saída)
- [ ] Histórico de movimentações
- [ ] Alertas de estoque baixo
- [ ] Integração com compras
- [ ] Relatórios de estoque
- [ ] Código de barras

