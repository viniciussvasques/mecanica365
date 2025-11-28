# Guia de Teste Manual - Módulo Auth

Este guia descreve como testar manualmente todos os endpoints do módulo Auth.

## 📋 Pré-requisitos

1. Backend rodando: `http://localhost:3001`
2. Swagger disponível: `http://localhost:3001/api/docs`
3. Tenant criado no banco de dados
4. Usuário criado no banco de dados

## 🧪 Testes Manuais

### 1. Criar Tenant e Usuário de Teste

```sql
-- Criar tenant
INSERT INTO tenants (id, name, cnpj, subdomain, plan, status, "createdAt", "updatedAt")
VALUES (
  'test-tenant-id',
  'Oficina Teste',
  '12345678000199',
  'teste',
  'workshops_starter',
  'active',
  NOW(),
  NOW()
);

-- Criar usuário (senha: TestPassword123)
INSERT INTO users (id, "tenantId", email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-user-id',
  'test-tenant-id',
  'teste@oficina.com',
  'Usuário Teste',
  '$2b$10$rQZ8KJ9XvYqZ8KJ9XvYqOuZ8KJ9XvYqOuZ8KJ9XvYqOuZ8KJ9XvYqOu', -- hash de 'TestPassword123'
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Nota:** Para gerar o hash da senha, use:
```bash
docker-compose exec backend node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TestPassword123', 10).then(h => console.log(h))"
```

### 2. Teste de Login

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Subdomain: teste" \
  -d '{
    "email": "teste@oficina.com",
    "password": "TestPassword123"
  }'
```

**Response esperado (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "test-user-id",
    "email": "teste@oficina.com",
    "name": "Usuário Teste",
    "role": "admin"
  }
}
```

**Testes de erro:**
- Email inválido → 400
- Senha incorreta → 401
- Usuário inativo → 401
- Tenant inativo → 401

### 3. Teste de Obter Perfil

**Request:**
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer {accessToken}"
```

**Response esperado (200):**
```json
{
  "id": "test-user-id",
  "email": "teste@oficina.com",
  "name": "Usuário Teste",
  "role": "admin",
  "isActive": true,
  "tenantId": "test-tenant-id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Testes de erro:**
- Sem token → 401
- Token inválido → 401
- Token expirado → 401

### 4. Teste de Refresh Token

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{refreshToken}"
  }'
```

**Response esperado (200):**
```json
{
  "accessToken": "novo-access-token...",
  "refreshToken": "novo-refresh-token-uuid"
}
```

**Testes de erro:**
- Refresh token inválido → 401
- Refresh token expirado → 401
- Refresh token revogado → 401

### 5. Teste de Alterar Senha

**Request:**
```bash
curl -X PATCH http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPassword123",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

**Response esperado (204):** Sem conteúdo

**Testes de erro:**
- Senhas não coincidem → 400
- Nova senha igual à atual → 400
- Senha atual incorreta → 401
- Nova senha muito curta → 400
- Nova senha sem maiúscula/minúscula/número → 400

### 6. Teste de Logout

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{refreshToken}"
  }'
```

**Response esperado (204):** Sem conteúdo

**Testes de erro:**
- Sem token → 401
- Refresh token não fornecido → 400

## ✅ Checklist de Validação

- [ ] Login funciona com credenciais corretas
- [ ] Login falha com credenciais incorretas
- [ ] Login falha com usuário inativo
- [ ] Login falha com tenant inativo
- [ ] Perfil retorna dados corretos
- [ ] Perfil falha sem token
- [ ] Refresh token gera novos tokens
- [ ] Refresh token falha com token inválido
- [ ] Alterar senha funciona com senha atual correta
- [ ] Alterar senha falha com senha atual incorreta
- [ ] Alterar senha valida confirmação
- [ ] Alterar senha valida força da senha
- [ ] Logout revoga refresh token
- [ ] Após logout, refresh token não funciona mais

## 🔍 Verificações no Banco

```sql
-- Verificar refresh tokens criados
SELECT * FROM refresh_tokens WHERE "userId" = 'test-user-id';

-- Verificar refresh tokens revogados
SELECT * FROM refresh_tokens WHERE "userId" = 'test-user-id' AND "revokedAt" IS NOT NULL;
```

## 📝 Notas

- Todos os endpoints estão documentados no Swagger: `http://localhost:3001/api/docs`
- Use o Swagger para testar interativamente
- Os tokens JWT podem ser decodificados em https://jwt.io
- Os logs do backend mostram tentativas de login e erros

