# 📋 Módulo Customers (Clientes)

**Status:** ✅ Backend Completo | ✅ Frontend Completo

## 📋 Visão Geral

Módulo completo de gerenciamento de clientes para oficinas mecânicas.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
customers/
├── dto/
│   ├── create-customer.dto.ts
│   ├── update-customer.dto.ts
│   ├── customer-response.dto.ts
│   ├── customer-filters.dto.ts
│   └── index.ts
├── customers.controller.ts
├── customers.service.ts
├── customers.module.ts
└── README.md
```

## 🔌 Endpoints da API

### `POST /api/customers`
Cria um novo cliente.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao.silva@email.com",
  "phone": "(11) 98765-4321",
  "cpf": "12345678901",
  "address": "Rua das Flores, 123 - Centro - São Paulo/SP",
  "notes": "Cliente preferencial"
}
```

### `GET /api/customers`
Lista clientes com filtros e paginação.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Query Parameters:**
- `name` (opcional): Busca por nome (parcial)
- `phone` (opcional): Busca por telefone
- `email` (opcional): Busca por email
- `cpf` (opcional): Busca por CPF
- `page` (opcional, padrão: 1): Número da página
- `limit` (opcional, padrão: 20): Itens por página (máx: 100)

**Resposta:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### `GET /api/customers/:id`
Busca um cliente por ID.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

### `PATCH /api/customers/:id`
Atualiza um cliente.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:** (todos os campos opcionais)
```json
{
  "name": "João Silva Santos",
  "email": "joao.santos@email.com",
  "phone": "(11) 98765-4321",
  "cpf": "12345678901",
  "address": "Nova Rua, 456",
  "notes": "Atualizado"
}
```

### `DELETE /api/customers/:id`
Remove um cliente.

**Permissões:** `admin`, `manager`

**Validações:**
- Não permite excluir se houver ordens de serviço vinculadas
- Não permite excluir se houver faturas vinculadas
- Não permite excluir se houver agendamentos vinculados

## 🔐 Regras de Negócio

### Validações

1. **Nome:**
   - Obrigatório
   - Mínimo: 3 caracteres
   - Máximo: 255 caracteres

2. **Telefone:**
   - Obrigatório
   - Formato: `(00) 00000-0000` ou `(00) 0000-0000`
   - Único por tenant

3. **Email:**
   - Opcional
   - Formato válido de email

4. **CPF:**
   - Opcional
   - 11 dígitos numéricos
   - Validação de dígitos verificadores
   - Único por tenant (se fornecido)

5. **Endereço:**
   - Opcional
   - Máximo: 500 caracteres

6. **Observações:**
   - Opcional
   - Máximo: 1000 caracteres

### Regras de Exclusão

- ❌ Não pode excluir se tiver ordens de serviço
- ❌ Não pode excluir se tiver faturas
- ❌ Não pode excluir se tiver agendamentos

## 🛡️ Segurança e Permissões

### Feature Flag
- **Feature:** `customers`
- **Habilitado em:** Todos os planos (Starter, Professional, Enterprise)
- **Limite Starter:** 100 clientes
- **Limite Professional/Enterprise:** Ilimitado

### Permissões por Role

| Ação | Admin | Manager | Mechanic | Receptionist |
|------|-------|---------|----------|--------------|
| Criar | ✅ | ✅ | ❌ | ✅ |
| Listar | ✅ | ✅ | ✅ | ✅ |
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| Editar | ✅ | ✅ | ❌ | ✅ |
| Excluir | ✅ | ✅ | ❌ | ❌ |

## 📊 Modelo de Dados

### Customer (Prisma)

```prisma
model Customer {
  id            String            @id @default(uuid())
  tenantId      String
  name          String
  email         String?
  phone         String
  cpf           String?
  address       String?
  notes         String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  
  // Relacionamentos
  appointments  Appointment[]
  vehicles      CustomerVehicle[]
  invoices      Invoice[]
  serviceOrders ServiceOrder[]
  
  @@unique([tenantId, phone])
  @@index([tenantId, name])
  @@map("customers")
}
```

## ✅ Checklist de Implementação

### Backend ✅

- [x] Schema Prisma (já existia)
- [x] DTOs criados (Create, Update, Response, Filters)
- [x] Service implementado com CRUD completo
- [x] Regras de negócio implementadas
- [x] Controller implementado com todos os endpoints
- [x] Guards e permissões configurados
- [x] Feature flags configurados
- [x] Swagger documentado
- [x] Tratamento de erros
- [x] Validações implementadas
- [ ] Testes unitários
- [ ] Testes de integração

### Frontend ✅

- [x] Estrutura de pastas criada
- [x] Componentes base criados
- [x] API client configurado (`lib/api/customers.ts`)
- [x] Páginas de listagem implementadas (`/customers`)
- [x] Páginas de criação implementadas (`/customers/new`)
- [x] Páginas de edição implementadas (`/customers/[id]/edit`)
- [x] Páginas de detalhes implementadas (`/customers/[id]`)
- [x] Formulários validados
- [x] Filtros e busca funcionando
- [x] Paginação implementada
- [x] Loading states
- [x] Tratamento de erros
- [x] Responsividade

## 🚀 Próximos Passos

1. **Melhorias Frontend:**
   - Adicionar sistema de notificações (toast)
   - Melhorar UX com confirmações visuais
   - Adicionar exportação de dados (CSV/Excel)
   - Implementar busca avançada

2. **Integração:**
   - Testar fluxos completos end-to-end
   - Validar permissões em produção
   - Validar limites por plano
   - Adicionar testes E2E

3. **Funcionalidades Futuras:**
   - Histórico de alterações
   - Relacionamento com veículos
   - Relacionamento com ordens de serviço
   - Dashboard de clientes

---

**Última atualização:** 2024-12-28
**Versão:** 1.0.0

## 📁 Estrutura Frontend

```
frontend/
├── app/
│   └── customers/
│       ├── page.tsx                    # Listagem de clientes
│       ├── new/
│       │   └── page.tsx               # Criar novo cliente
│       └── [id]/
│           ├── page.tsx               # Detalhes do cliente
│           └── edit/
│               └── page.tsx          # Editar cliente
└── lib/
    └── api/
        └── customers.ts               # API client
```

