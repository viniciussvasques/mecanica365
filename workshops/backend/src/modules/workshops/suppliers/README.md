# 🏭 SuppliersModule - Gestão de Fornecedores

## 📋 Descrição

Módulo responsável pela gestão completa de fornecedores, incluindo CRUD, validações e integração com o módulo de peças.

## 🎯 Funcionalidades

### CRUD de Fornecedores
- ✅ Criar fornecedor
- ✅ Listar fornecedores com filtros
- ✅ Buscar fornecedor por ID
- ✅ Atualizar fornecedor
- ✅ Remover fornecedor

### Validações
- ✅ Validação de documento único por tenant
- ✅ Validação antes de remover (verifica peças vinculadas)
- ✅ Validação de dados obrigatórios

### Integrações
- ✅ Integração com `PartsModule` (peças vinculadas)

## 📁 Estrutura

```
suppliers/
├── dto/
│   ├── create-supplier.dto.ts      # DTO para criação
│   ├── update-supplier.dto.ts      # DTO para atualização
│   ├── supplier-response.dto.ts    # DTO de resposta
│   ├── supplier-filters.dto.ts     # DTO para filtros
│   └── index.ts
├── suppliers.controller.ts          # Controller REST
├── suppliers.service.ts             # Service com lógica de negócio
├── suppliers.module.ts              # Módulo NestJS
└── suppliers.service.spec.ts        # Testes unitários
```

## 🔌 Endpoints

### Fornecedores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/suppliers` | Criar novo fornecedor |
| `GET` | `/api/suppliers` | Listar fornecedores (com filtros) |
| `GET` | `/api/suppliers/:id` | Buscar fornecedor por ID |
| `PATCH` | `/api/suppliers/:id` | Atualizar fornecedor |
| `DELETE` | `/api/suppliers/:id` | Remover fornecedor |

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin`, `manager`

## 📝 Exemplo de Uso

### Criar Fornecedor

```typescript
POST /api/suppliers
{
  "name": "Fornecedor ABC",
  "documentType": "cnpj",
  "document": "12345678000190",
  "phone": "(11) 98765-4321",
  "email": "contato@fornecedor.com",
  "address": "Rua das Empresas, 456",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "contactName": "João Silva",
  "notes": "Fornecedor preferencial"
}
```

### Listar Fornecedores com Filtros

```typescript
GET /api/suppliers?search=ABC&isActive=true&city=São Paulo
```

## 🧪 Testes

- ✅ Testes unitários implementados
- ✅ Cobertura: 100%
- ✅ Testa CRUD completo
- ✅ Testa validações
- ✅ Testa filtros

## 🔗 Integrações

### PartsModule
- Fornecedores podem ser vinculados a peças
- Validação antes de remover fornecedor com peças vinculadas

## ⚠️ Regras de Negócio

1. **Documento Único:**
   - Documento (CNPJ/CPF) deve ser único por tenant
   - Validação ao criar/atualizar fornecedor

2. **Remoção:**
   - Não é possível remover fornecedor com peças vinculadas
   - Requer desvincular peças antes da remoção

3. **Status:**
   - Fornecedores podem ser ativados/desativados
   - Filtro por status disponível

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados

## 🚀 Próximos Passos

- [ ] Histórico de compras
- [ ] Cotação de preços
- [ ] Avaliações de fornecedores
- [ ] Catálogo de produtos por fornecedor

