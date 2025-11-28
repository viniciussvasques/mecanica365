# Planejamento Técnico - Módulo Auth

**Data:** 2024  
**Status:** Planejamento  
**Prioridade:** 🔴 Alta

---

## 1. DEFINIÇÃO DE REQUISITOS

### 1.1. Requisitos Funcionais

#### RF01 - Login
- **Descrição:** Usuário deve poder fazer login com email e senha
- **Entrada:** Email, senha, tenant (via subdomain)
- **Saída:** Access token (JWT) e refresh token
- **Validações:**
  - Email válido
  - Senha com mínimo 8 caracteres
  - Usuário deve existir e estar ativo
  - Tenant deve estar ativo
  - Credenciais devem ser válidas

#### RF02 - Logout
- **Descrição:** Usuário deve poder fazer logout
- **Entrada:** Access token
- **Saída:** Confirmação de logout
- **Validações:**
  - Token válido
  - Token não expirado

#### RF03 - Refresh Token
- **Descrição:** Usuário deve poder renovar access token usando refresh token
- **Entrada:** Refresh token
- **Saída:** Novo access token e novo refresh token
- **Validações:**
  - Refresh token válido
  - Refresh token não expirado
  - Refresh token não revogado

#### RF04 - Obter Perfil
- **Descrição:** Usuário autenticado deve poder obter seus próprios dados
- **Entrada:** Access token
- **Saída:** Dados do usuário (sem senha)
- **Validações:**
  - Token válido
  - Usuário existe e está ativo

#### RF05 - Alterar Senha
- **Descrição:** Usuário autenticado deve poder alterar sua senha
- **Entrada:** Senha atual, nova senha, confirmação de nova senha
- **Saída:** Confirmação de alteração
- **Validações:**
  - Token válido
  - Senha atual correta
  - Nova senha diferente da atual
  - Nova senha atende critérios de segurança
  - Confirmação de senha igual à nova senha

#### RF06 - Recuperação de Senha (Futuro)
- **Descrição:** Usuário deve poder solicitar recuperação de senha
- **Entrada:** Email
- **Saída:** Token de recuperação enviado por email
- **Validações:**
  - Email válido
  - Email existe no sistema

### 1.2. Requisitos Não Funcionais

#### RNF01 - Performance
- Login deve responder em < 500ms
- Validação de token deve ser < 50ms
- Refresh token deve responder em < 300ms

#### RNF02 - Segurança
- Senhas devem ser hasheadas com bcrypt (salt rounds: 10)
- Tokens JWT devem expirar (access: 15min, refresh: 7d)
- Refresh tokens devem ser armazenados no banco (revogação)
- Rate limiting: 5 tentativas de login por minuto por IP
- Bloqueio temporário após 5 tentativas falhas (15min)
- Tokens devem ser invalidados no logout
- HTTPS obrigatório em produção

#### RNF03 - Escalabilidade
- Autenticação deve suportar múltiplos tenants
- Tokens devem ser stateless (JWT)
- Refresh tokens devem ser armazenados no banco (multi-instância)

#### RNF04 - Conformidade
- LGPD: Não armazenar senhas em texto plano
- LGPD: Logs de autenticação (sem dados sensíveis)
- LGPD: Consentimento para uso de dados

---

## 2. ARQUITETURA

### 2.1. Arquitetura do Módulo

```
Auth Module
├── AuthModule
├── AuthService (lógica de negócio)
├── AuthController (endpoints)
├── Strategies/
│   └── JwtStrategy (passport-jwt)
├── Guards/
│   ├── JwtAuthGuard (proteção de rotas)
│   └── RolesGuard (autorização por role)
├── Decorators/
│   ├── CurrentUser (obter usuário atual)
│   └── Roles (definir roles permitidas)
└── DTOs/
    ├── LoginDto
    ├── LoginResponseDto
    ├── RefreshTokenDto
    ├── ChangePasswordDto
    └── ProfileResponseDto
```

### 2.2. Fluxo de Dados

#### Login Flow
```
1. Cliente → POST /api/auth/login
   Body: { email, password }
   Header: Host: {subdomain}.domain.com
   
2. TenantResolverMiddleware → Resolve tenant do subdomain
   
3. AuthController → Valida DTO
   
4. AuthService → 
   - Busca usuário por email + tenantId
   - Valida senha (bcrypt.compare)
   - Verifica se usuário está ativo
   - Gera access token (JWT)
   - Gera refresh token (UUID)
   - Salva refresh token no banco
   
5. Retorna: { accessToken, refreshToken, user }
```

#### Refresh Token Flow
```
1. Cliente → POST /api/auth/refresh
   Body: { refreshToken }
   
2. AuthService →
   - Valida refresh token (busca no banco)
   - Verifica se não expirou
   - Verifica se não foi revogado
   - Gera novo access token
   - Gera novo refresh token
   - Revoga refresh token antigo
   - Salva novo refresh token
   
3. Retorna: { accessToken, refreshToken }
```

### 2.3. Integração com Outros Módulos

- **Users Module:** Buscar usuário por email/tenantId
- **Tenants Module:** Validar tenant ativo
- **Prisma:** Acesso ao banco de dados

---

## 3. MODELAGEM DE DADOS

### 3.1. Schema Prisma

**Adicionar ao schema.prisma:**

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

**Atualizar model User:**
```prisma
model User {
  // ... campos existentes
  refreshTokens RefreshToken[]
}
```

### 3.2. Índices

- `refresh_tokens.userId` - Busca rápida por usuário
- `refresh_tokens.token` - Busca rápida por token (unique)
- `users.tenantId + email` - Busca rápida no login (já existe unique)

---

## 4. CONFIGURAÇÃO

### 4.1. Variáveis de Ambiente

```env
# JWT
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting (futuro)
RATE_LIMIT_LOGIN=5
RATE_LIMIT_WINDOW=60000
```

### 4.2. Dependências

**Já instaladas:**
- `@nestjs/jwt` ✅
- `@nestjs/passport` ✅
- `passport` ✅
- `passport-jwt` ✅
- `bcrypt` ✅

**Adicionar:**
- Nenhuma (todas já estão instaladas)

---

## 5. IMPLEMENTAÇÃO

### 5.1. Estrutura de Arquivos

```
src/modules/core/auth/
├── auth.module.ts
├── auth.service.ts
├── auth.controller.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
├── dto/
│   ├── login.dto.ts
│   ├── login-response.dto.ts
│   ├── refresh-token.dto.ts
│   ├── change-password.dto.ts
│   └── profile-response.dto.ts
└── PLANEJAMENTO_TECNICO.md
```

### 5.2. DTOs

#### LoginDto
```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

#### LoginResponseDto
```typescript
export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
```

#### RefreshTokenDto
```typescript
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

#### ChangePasswordDto
```typescript
export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
```

### 5.3. Service Methods

```typescript
class AuthService {
  async login(email: string, password: string, tenantId: string): Promise<LoginResponseDto>
  async logout(userId: string, refreshToken: string): Promise<void>
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>
  async getProfile(userId: string): Promise<ProfileResponseDto>
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void>
  private generateAccessToken(user: User): string
  private generateRefreshToken(): string
  private async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>
  private async revokeRefreshToken(token: string): Promise<void>
  private async validateRefreshToken(token: string): Promise<RefreshToken>
}
```

### 5.4. Controller Endpoints

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto, @TenantId() tenantId: string): Promise<LoginResponseDto>

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User, @Body() dto: RefreshTokenDto): Promise<void>

  @Post('refresh')
  @Public()
  async refresh(@Body() dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }>

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto>

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto): Promise<void>
}
```

---

## 6. TESTES

### 6.1. Testes Unitários

**Arquivo:** `auth.service.spec.ts`

**Cenários:**
- ✅ Login com credenciais válidas
- ✅ Login com email inválido
- ✅ Login com senha incorreta
- ✅ Login com usuário inativo
- ✅ Login com tenant inativo
- ✅ Refresh token válido
- ✅ Refresh token inválido
- ✅ Refresh token expirado
- ✅ Refresh token revogado
- ✅ Alterar senha com senha atual correta
- ✅ Alterar senha com senha atual incorreta
- ✅ Alterar senha com nova senha igual à atual

### 6.2. Testes de Integração

**Arquivo:** `auth.e2e-spec.ts`

**Cenários:**
- ✅ Fluxo completo de login
- ✅ Fluxo completo de refresh token
- ✅ Fluxo completo de logout
- ✅ Obter perfil autenticado
- ✅ Alterar senha
- ✅ Acesso negado sem token
- ✅ Acesso negado com token inválido

---

## 7. SEGURANÇA

### 7.1. Checklist de Segurança

- ✅ Senhas hasheadas com bcrypt (salt rounds: 10)
- ✅ Tokens JWT com expiração
- ✅ Refresh tokens armazenados no banco
- ✅ Revogação de refresh tokens no logout
- ✅ Validação de DTOs
- ✅ Rate limiting (futuro - implementar middleware)
- ✅ Bloqueio após tentativas falhas (futuro)
- ✅ HTTPS obrigatório (configuração de deploy)
- ✅ CORS configurado
- ✅ Sanitização de inputs (class-validator)

### 7.2. Proteções

- **SQL Injection:** Prisma (prepared statements)
- **XSS:** Validação de inputs
- **CSRF:** Tokens JWT (stateless)
- **Brute Force:** Rate limiting (futuro)

---

## 8. DOCUMENTAÇÃO

### 8.1. Swagger/OpenAPI

- Documentar todos os endpoints
- Exemplos de request/response
- Schemas dos DTOs
- Autenticação Bearer Token

### 8.2. README do Módulo

- Descrição do módulo
- Como usar
- Exemplos de código
- Troubleshooting

---

## 9. PRÓXIMOS PASSOS

### Fase 1: Implementação Base
1. [ ] Criar migration para RefreshToken
2. [ ] Criar DTOs
3. [ ] Criar JWT Strategy
4. [ ] Criar Guards e Decorators
5. [ ] Implementar AuthService
6. [ ] Implementar AuthController
7. [ ] Registrar módulo no AppModule

### Fase 2: Testes
8. [ ] Testes unitários (AuthService)
9. [ ] Testes de integração (E2E)
10. [ ] Testes de segurança

### Fase 3: Melhorias
11. [ ] Rate limiting
12. [ ] Bloqueio após tentativas falhas
13. [ ] Recuperação de senha
14. [ ] MFA (opcional)

---

## 10. DECISÕES TÉCNICAS (ADR)

### ADR001 - JWT vs Session
**Decisão:** Usar JWT para access tokens
**Motivo:** Stateless, escalável, multi-instância
**Alternativa considerada:** Sessions (Redis)
**Trade-off:** Refresh tokens no banco para revogação

### ADR002 - Bcrypt Salt Rounds
**Decisão:** 10 rounds
**Motivo:** Balance entre segurança e performance
**Alternativa considerada:** 12 rounds (mais seguro, mais lento)

### ADR003 - Token Expiration
**Decisão:** Access 15min, Refresh 7d
**Motivo:** Segurança (access curto) + UX (refresh longo)
**Alternativa considerada:** Access 1h (menos seguro)

---

**Documento criado em:** 2024  
**Versão:** 1.0

