# 🧪 Testes Manuais - Módulo Customers

## 📋 Pré-requisitos

1. Backend rodando: `npm run start:dev`
2. Swagger disponível: `http://localhost:3001/api`
3. Token JWT válido (fazer login primeiro)
4. Header `X-Tenant-Subdomain` configurado

---

## ✅ Testes Unitários

**Status:** ✅ **23 testes passando**

```bash
npm run test -- customers.service.spec.ts
```

---

## 🔧 Testes Manuais via Swagger

### 1. Criar Cliente

**Endpoint:** `POST /api/customers`

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao.silva@email.com",
  "phone": "(11) 98765-4321",
  "cpf": "11144477735",
  "address": "Rua das Flores, 123",
  "notes": "Cliente preferencial"
}
```

**Esperado:** `201 Created` com dados do cliente

---

### 2. Listar Clientes

**Endpoint:** `GET /api/customers`

**Query Params:**
- `page=1`
- `limit=20`
- `name=João` (opcional)

**Esperado:** `200 OK` com lista paginada

---

### 3. Buscar Cliente por ID

**Endpoint:** `GET /api/customers/:id`

**Esperado:** `200 OK` com dados do cliente

---

### 4. Atualizar Cliente

**Endpoint:** `PATCH /api/customers/:id`

**Body:**
```json
{
  "name": "João Silva Santos",
  "email": "joao.santos@email.com"
}
```

**Esperado:** `200 OK` com dados atualizados

---

### 5. Remover Cliente

**Endpoint:** `DELETE /api/customers/:id`

**Esperado:** `204 No Content`

---

## ❌ Testes de Validação

### CPF Inválido
```json
{
  "name": "Teste",
  "phone": "(11) 98765-4321",
  "cpf": "12345678900"
}
```
**Esperado:** `400 Bad Request` - "CPF inválido"

### Telefone Duplicado
```json
{
  "name": "Outro Cliente",
  "phone": "(11) 98765-4321"
}
```
**Esperado:** `409 Conflict` - "Telefone já cadastrado"

### Cliente Não Encontrado
**Endpoint:** `GET /api/customers/non-existent-id`

**Esperado:** `404 Not Found`

---

## ✅ Checklist de Testes

- [x] Criar cliente com sucesso
- [x] Criar cliente sem CPF
- [x] Validar CPF inválido
- [x] Validar telefone duplicado
- [x] Listar clientes com paginação
- [x] Filtrar por nome
- [x] Buscar por ID
- [x] Atualizar cliente
- [x] Remover cliente
- [x] Validar exclusão com relacionamentos

