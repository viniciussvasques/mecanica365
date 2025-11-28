# Módulo Auth - Autenticação e Autorização

Módulo responsável por gerenciar autenticação e autorização de usuários no sistema.

## 📋 Funcionalidades

- ✅ Login com email e senha
- ✅ Logout com revogação de refresh token
- ✅ Renovação de access token via refresh token
- ✅ Obtenção de perfil do usuário autenticado
- ✅ Alteração de senha
- ✅ Validação JWT em todas as rotas protegidas
- ✅ Suporte a roles (RBAC)

## 🔐 Segurança

### Implementado

- ✅ Senhas hasheadas com bcrypt (salt rounds: 10)
- ✅ Tokens JWT com expiração configurável
- ✅ Refresh tokens armazenados no banco de dados
- ✅ Revogação de refresh tokens no logout
- ✅ Revogação de todos os refresh tokens ao alterar senha
- ✅ Validação de DTOs com class-validator
- ✅ Sanitização de inputs (normalização de email)
- ✅ Logs de segurança (tentativas de login falhadas)
- ✅ Proteção contra SQL Injection (Prisma)
- ✅ Proteção contra XSS (validação de inputs)

### Pendente (Futuro)

- ⏳ Rate limiting
- ⏳ Bloqueio após tentativas falhas
- ⏳ MFA (Multi-Factor Authentication)
- ⏳ Recuperação de senha

## 📡 Endpoints

### POST `/api/auth/login`

Fazer login no sistema.

**Headers:**
- `X-Tenant-Subdomain`: Subdomínio do tenant (obrigatório)

**Body:**
```json
{
  "email": "usuario@oficina.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "user-id",
    "email": "usuario@oficina.com",
    "name": "Nome do Usuário",
    "role": "admin"
  }
}
```

### POST `/api/auth/logout`

Fazer logout e revogar refresh token.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Body:**
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (204):** Sem conteúdo

### POST `/api/auth/refresh`

Renovar access token usando refresh token.

**Body:**
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "novo-refresh-token-uuid"
}
```

### GET `/api/auth/profile`

Obter perfil do usuário autenticado.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "id": "user-id",
  "email": "usuario@oficina.com",
  "name": "Nome do Usuário",
  "role": "admin",
  "isActive": true,
  "tenantId": "tenant-id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH `/api/auth/change-password`

Alterar senha do usuário autenticado.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Body:**
```json
{
  "currentPassword": "SenhaAtual123",
  "newPassword": "NovaSenha123",
  "confirmPassword": "NovaSenha123"
}
```

**Response (204):** Sem conteúdo

**Validações:**
- Nova senha deve ter no mínimo 8 caracteres
- Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número
- Nova senha e confirmação devem coincidir
- Nova senha deve ser diferente da senha atual

## 🧪 Testes

### Testes Unitários

```bash
# Executar testes do AuthService
npm run test auth.service.spec

# Executar testes do JwtStrategy
npm run test jwt.strategy.spec
```

### Testes E2E

```bash
# Executar testes E2E do Auth
npm run test:e2e auth.e2e-spec
```

## 📚 Estrutura

```
src/modules/core/auth/
├── auth.module.ts              # Módulo principal
├── auth.service.ts              # Lógica de negócio
├── auth.controller.ts           # Endpoints REST
├── auth.service.spec.ts         # Testes unitários do service
├── strategies/
│   ├── jwt.strategy.ts          # Estratégia JWT do Passport
│   └── jwt.strategy.spec.ts     # Testes unitários da strategy
├── guards/
│   ├── jwt-auth.guard.ts        # Guard de autenticação JWT
│   └── roles.guard.ts           # Guard de autorização por roles
├── decorators/
│   ├── current-user.decorator.ts # Decorator @CurrentUser
│   └── roles.decorator.ts        # Decorator @Roles
├── dto/
│   ├── login.dto.ts             # DTO de login
│   ├── login-response.dto.ts    # DTO de resposta de login
│   ├── refresh-token.dto.ts      # DTO de refresh token
│   ├── change-password.dto.ts   # DTO de alteração de senha
│   └── profile-response.dto.ts  # DTO de perfil
├── PLANEJAMENTO_TECNICO.md      # Planejamento técnico completo
└── README.md                     # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Uso em Outros Módulos

```typescript
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('example')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExampleController {
  @Get('protected')
  @Roles('admin', 'manager')
  async protectedRoute(@CurrentUser() user: { id: string; role: string }) {
    // Rota protegida que requer autenticação e role admin ou manager
    return { message: 'Acesso autorizado', userId: user.id };
  }
}
```

## 📝 Notas

- O refresh token é armazenado no banco de dados e pode ser revogado
- Ao alterar a senha, todos os refresh tokens do usuário são revogados
- O email é normalizado (lowercase + trim) antes de buscar no banco
- Todos os erros são logados para auditoria de segurança
- O módulo está totalmente testado (unitários + E2E)

## 🚀 Próximos Passos

1. Implementar rate limiting
2. Implementar bloqueio após tentativas falhas
3. Implementar recuperação de senha
4. Implementar MFA (opcional)

