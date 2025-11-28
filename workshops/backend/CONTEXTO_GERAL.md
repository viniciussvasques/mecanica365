# 📋 Contexto Geral - Backend Mecânica365

**Última atualização:** 2024-12-01  
**Status:** Em desenvolvimento - Código Limpo e Type-Safe

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Estado Atual do Projeto](#estado-atual-do-projeto)
3. [Estrutura Implementada](#estrutura-implementada)
4. [Módulos Implementados](#módulos-implementados)
5. [Módulos Planejados](#módulos-planejados)
6. [Schema do Banco de Dados](#schema-do-banco-de-dados)
7. [Configurações](#configurações)
8. [Documentação](#documentação)
9. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

O backend do **Mecânica365** é uma API REST desenvolvida em **NestJS 11+** com **TypeScript 5+**, utilizando **Prisma 5+** como ORM e **PostgreSQL 16+** como banco de dados. O sistema é **multi-tenant** e foi projetado para gerenciar oficinas mecânicas com inteligência artificial e automações.

### Stack Tecnológico

- **Framework:** NestJS 11.0.1
- **Linguagem:** TypeScript 5.7.3
- **ORM:** Prisma 6.19.0
- **Banco de Dados:** PostgreSQL 16+
- **Cache:** Redis 7+ (ioredis 5.8.2)
- **Autenticação:** JWT + Refresh Tokens (passport-jwt)
- **Documentação:** Swagger/OpenAPI
- **Validação:** class-validator + class-transformer
- **Email:** Nodemailer + Templates HTML
- **Pagamentos:** Stripe API
- **Testes:** Jest + Supertest

### Arquitetura

- **Padrão:** Monolito Modular (preparado para microserviços)
- **Multi-tenant:** Row-level security com `tenant_id`
- **Subdomínios:** `{subdomain}.mecanica365.app`
- **Feature Flags:** Sistema de ativação por plano

---

## 📊 Estado Atual do Projeto

### ✅ Implementado e Funcionando

#### 1. **Estrutura Base**
- ✅ Configuração inicial do NestJS
- ✅ Configuração do Prisma
- ✅ Configuração do Redis
- ✅ Configuração do Swagger
- ✅ Middleware de resolução de tenant
- ✅ Guards e decorators para multi-tenancy
- ✅ Filtros de exceção global
- ✅ Pipes de validação
- ✅ Health checks

#### 2. **Módulo Core - Autenticação**
- ✅ Login com JWT
- ✅ Refresh tokens
- ✅ Troca de senha (primeiro login)
- ✅ Busca de tenant por email
- ✅ Proteção de rotas
- ✅ Roles e permissões básicas

#### 3. **Módulo Core - Tenants**
- ✅ CRUD de tenants
- ✅ Status de tenant (pending, active, suspended, cancelled)
- ✅ Subdomínios únicos
- ✅ Validação de documentos (CPF/CNPJ)

#### 4. **Módulo Core - Usuários**
- ✅ CRUD de usuários
- ✅ Roles (admin, manager, mechanic, receptionist, stock_keeper, viewer)
- ✅ Vinculação com tenant
- ✅ Ativação/desativação

#### 5. **Módulo Core - Onboarding**
- ✅ Registro de novo tenant
- ✅ Integração com Stripe Checkout
- ✅ Webhooks do Stripe
- ✅ Ativação automática após pagamento
- ✅ Criação automática de usuário admin
- ✅ Envio de email de boas-vindas

#### 6. **Módulo Core - Billing**
- ✅ Gestão de assinaturas
- ✅ Integração com Stripe
- ✅ Planos (Starter, Professional, Enterprise)
- ✅ Webhooks de pagamento

#### 7. **Módulo Shared - Email**
- ✅ Serviço de email (Nodemailer)
- ✅ Templates HTML profissionais
- ✅ Suporte a SMTP
- ✅ Email de boas-vindas
- ✅ Email de falha de pagamento
- ✅ Bulk email service
- ✅ Configuração Mailcow/Gmail

#### 8. **Infraestrutura**
- ✅ Docker e Docker Compose
- ✅ Scripts de setup
- ✅ Migrations do Prisma
- ✅ Variáveis de ambiente

#### 9. **Módulo Workshops - Customers**
- ✅ CRUD completo de clientes
- ✅ Validação de CPF
- ✅ Filtros e paginação
- ✅ Testes unitários completos
- ✅ Integração com Feature Flags

#### 10. **Qualidade de Código**
- ✅ **0 erros** de linting
- ✅ **0 warnings** de linting
- ✅ **100% type-safe** (sem `any` desnecessário)
- ✅ ESLint configurado para bloquear `any` explicitamente
- ✅ Testes E2E completamente tipados
- ✅ Utilitários de tratamento de erros (`error.utils.ts`)

---

## 🏗️ Estrutura Implementada

```
workshops/backend/
├── src/
│   ├── app/                    # App principal
│   ├── common/                 # Recursos compartilhados
│   │   ├── decorators/         # @Public, @TenantId, etc.
│   │   ├── filters/            # Exception filters
│   │   ├── guards/             # Auth guards, Tenant guards
│   │   ├── middleware/         # Tenant resolver
│   │   └── pipes/              # Validation pipes
│   ├── config/                 # Configurações
│   ├── database/                # Prisma service
│   ├── health/                 # Health checks
│   └── modules/
│       ├── core/                # Módulos core
│       │   ├── auth/           # ✅ Autenticação
│       │   ├── tenants/         # ✅ Tenants
│       │   ├── users/           # ✅ Usuários
│       │   ├── onboarding/     # ✅ Onboarding
│       │   └── billing/         # ✅ Billing
│       ├── shared/              # Módulos compartilhados
│       │   └── email/          # ✅ Email service
│       └── workshops/           # Módulos de features
│           ├── customers/      # ✅ Implementado
│           ├── service-orders/ # 📋 Planejado
│           ├── quotes/         # 📋 Planejado
│           ├── vehicles/       # 📋 Planejado
│           ├── inventory/      # 📋 Planejado
│           ├── appointments/   # 📋 Planejado
│           ├── invoices/       # 📋 Planejado
│           ├── payments/       # 📋 Planejado
│           └── diagnostics/   # 📋 Planejado
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── migrations/             # Migrations
├── test/                       # Testes E2E (completamente tipados)
├── docs/                       # 📚 Documentação organizada
│   ├── planejamento/           # Documentos de planejamento
│   ├── configuracao/           # Guias de configuração
│   ├── implementacao/          # Documentos de implementação
│   ├── integracao/            # Documentação de integrações
│   └── desenvolvimento/       # Guias de desenvolvimento
└── scripts/                    # Scripts auxiliares
```

---

## 📦 Módulos Implementados

### ✅ Core - Autenticação (`/modules/core/auth`)

**Funcionalidades:**
- Login com email/senha
- JWT tokens (access + refresh)
- Troca de senha obrigatória no primeiro login
- Busca de tenant por email (sem precisar subdomain)
- Proteção de rotas com guards
- Roles e permissões

**Endpoints:**
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/change-password` - Trocar senha
- `POST /api/auth/find-tenant` - Buscar tenant por email

**Status:** ✅ Completo e testado

---

### ✅ Core - Tenants (`/modules/core/tenants`)

**Funcionalidades:**
- CRUD completo de tenants
- Validação de subdomain único
- Status de tenant
- Busca por subdomain

**Endpoints:**
- `POST /api/tenants` - Criar tenant
- `GET /api/tenants/:id` - Buscar tenant
- `GET /api/tenants/subdomain/:subdomain` - Buscar por subdomain
- `PATCH /api/tenants/:id` - Atualizar tenant
- `DELETE /api/tenants/:id` - Deletar tenant

**Status:** ✅ Completo e testado

---

### ✅ Core - Onboarding (`/modules/core/onboarding`)

**Funcionalidades:**
- Registro de novo tenant
- Criação de checkout session no Stripe
- Webhooks do Stripe (todos os eventos tratados)
- Ativação automática após pagamento
- Criação automática de usuário admin
- Envio de email de boas-vindas

**Endpoints:**
- `POST /api/onboarding/register` - Registrar novo tenant
- `POST /api/onboarding/checkout` - Criar checkout session
- `POST /api/onboarding/webhooks/stripe` - Webhook do Stripe
- `POST /api/onboarding/check-status` - Verificar status

**Eventos Stripe Tratados:**
- ✅ `checkout.session.completed`
- ✅ `checkout.session.async_payment_failed`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.failed`
- ✅ `invoice.payment_failed`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.upcoming`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.trial_will_end`

**Status:** ✅ Completo e testado

---

### ✅ Shared - Email (`/modules/shared/email`)

**Funcionalidades:**
- Envio de emails via SMTP
- Templates HTML profissionais
- Suporte a múltiplos provedores (Gmail, Mailcow, etc.)
- Bulk email service
- Email de boas-vindas
- Email de falha de pagamento

**Templates Disponíveis:**
- Welcome Email
- Payment Failed Email
- Payment Succeeded Email
- Invoice Upcoming Email

**Status:** ✅ Completo e testado

---

### ✅ Workshops - Customers (`/modules/workshops/customers`)

**Funcionalidades:**
- CRUD completo de clientes
- Validação de CPF
- Filtros e paginação
- Busca por nome, email, telefone, CPF
- Validação de duplicatas

**Endpoints:**
- `POST /api/customers` - Criar cliente
- `GET /api/customers` - Listar clientes (com filtros)
- `GET /api/customers/:id` - Buscar cliente
- `PATCH /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Deletar cliente

**Status:** ✅ Completo e testado

---

## 📋 Módulos Planejados

### 📋 Fase 1: MVP (Sprint 1-4)

**Módulos:**
1. **Elevadores** - Cadastro e status em tempo real
2. **Inventário** - Controle de estoque básico
3. ✅ **Clientes** - CRUD completo (**IMPLEMENTADO**)
4. **Veículos** - CRUD completo + busca automática RENAVAN/VIN
5. **Ordens de Serviço** - CRUD completo + checklist
6. **Orçamentos** - CRUD completo + conversão para OS
7. **Geração de Documentos** - PDFs básicos

**Status:** 📋 Planejamento completo em `docs/planejamento/PLANEJAMENTO_COMPLETO.md`

---

### 📋 Fase 2: Core (Sprint 5-8)

**Módulos:**
1. **Agendamentos** - Calendário e notificações
2. **Nota Fiscal** - Emissão básica de NFe
3. **Cobranças** - Múltiplas formas de pagamento
4. **Histórico Automático** - Sistema inteligente
5. **Sugestões Inteligentes** - Óleo, peças, serviços
6. **Checklists** - Entrada e saída
7. **Timeline** - Linha do tempo de OS

**Status:** 📋 Planejamento completo

---

### 📋 Fase 3: Avançado (Sprint 9-12)

**Módulos:**
1. **Diagnóstico OBD2** - Integração com scanners
2. **CRM** - Funil de conversão, follow-up
3. **Financeiro Avançado** - Fluxo de caixa, conciliação
4. **Relatórios Avançados** - Dashboards e análises
5. **Fornecedores** - Gestão de fornecedores
6. **Catálogo de Peças** - Base de dados completa
7. **Automações** - Regras de negócio inteligentes
8. **App Mobile** - Aplicativo nativo

**Status:** 📋 Planejamento completo

---

## 🗄️ Schema do Banco de Dados

### Entidades Principais (Implementadas)

```prisma
// Core
model Tenant {
  id            String   @id @default(uuid())
  name          String
  documentType  String
  document      String
  subdomain     String   @unique
  adminEmail    String?
  plan          String
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  subscription  Subscription?
  users         User[]
}

model Subscription {
  id                  String   @id @default(uuid())
  tenantId            String   @unique
  plan                String
  status              String
  stripeCustomerId    String?
  stripeSubscriptionId String?
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  tenant              Tenant   @relation(fields: [tenantId], references: [id])
}

model User {
  id              String   @id @default(uuid())
  tenantId        String
  email           String
  password        String
  name            String
  role            String
  isActive        Boolean  @default(true)
  passwordChangedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  refreshTokens   RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
```

### Entidades Planejadas

Ver `docs/planejamento/PLANEJAMENTO_COMPLETO.md` para schema completo com todas as entidades.

---

## ⚙️ Configurações

### Variáveis de Ambiente

Ver `env.example` e `docs/configuracao/ENV_SETUP.md` para lista completa.

**Principais:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret para JWT
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SMTP_*` - Configurações de SMTP

### Docker

Ver `docs/configuracao/README_DOCKER.md` para setup completo.

**Comandos:**
```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Logs
docker-compose logs -f
```

---

## 📚 Documentação

### Estrutura de Documentação

A documentação está organizada em `docs/`:

- **`docs/planejamento/`** - Documentos de planejamento e arquitetura
  - `PLANEJAMENTO_COMPLETO.md` - **Documento principal** com tudo detalhado
  - `PLANEJAMENTO_MODULOS.md` - Planejamento dos módulos
  - `SISTEMA_INTELIGENTE.md` - Sistema inteligente

- **`docs/configuracao/`** - Guias de configuração
  - `ENV_SETUP.md` - Variáveis de ambiente
  - `SMTP_SETUP.md` - Configuração de SMTP
  - `README_DOCKER.md` - Setup do Docker

- **`docs/implementacao/`** - Documentos de implementação
  - `SISTEMA_EMAILS_WEBHOOKS.md` - Sistema de emails
  - `STATUS_COMPLETO.md` - Status do projeto

- **`docs/integracao/`** - Integrações externas
  - `EVENTOS_STRIPE.md` - Eventos do Stripe
  - `STRIPE_WEBHOOK_TUNNEL.md` - Webhook tunnel

### Documentos na Raiz

- `README.md` - Visão geral do projeto
- `CONTEXTO_GERAL.md` - Este documento (contexto atual)
- `PENDENCIAS.md` - Pendências e próximos passos

---

## 🚀 Próximos Passos

### Imediato (Esta Semana)

1. ✅ **Organizar documentação** - CONCLUÍDO
2. ✅ **Criar planejamento completo** - CONCLUÍDO
3. ✅ **Implementar Feature Flags Service** - CONCLUÍDO
4. ✅ **Criar estrutura base dos módulos de features** - CONCLUÍDO
5. ✅ **Corrigir todos os warnings do ESLint** - CONCLUÍDO (93 → 0)
6. ✅ **Implementar módulo Customers** - CONCLUÍDO
7. ✅ **Melhorar type safety** - CONCLUÍDO (100% type-safe)

### Curto Prazo (Próximas 2 Semanas)

1. ⏳ **Módulo de Elevadores** (CRUD básico)
2. ⏳ **Módulo de Inventário** (CRUD básico)
3. ✅ **Módulo de Clientes** (CRUD completo) - **CONCLUÍDO**
4. ⏳ **Módulo de Veículos** (CRUD + busca RENAVAN/VIN)

### Médio Prazo (Próximo Mês)

1. ⏳ **Módulo de Ordens de Serviço** (completo)
2. ⏳ **Módulo de Orçamentos** (completo)
3. ⏳ **Sistema de Histórico Automático**
4. ⏳ **Sugestões Inteligentes** (óleo, peças)

### Longo Prazo (Próximos 3 Meses)

1. ⏳ **Todos os módulos da Fase 1**
2. ⏳ **Integrações externas** (RENAVAN, VIN, FIPE)
3. ⏳ **App Mobile**
4. ⏳ **IA Avançada**

---

## 📊 Métricas do Projeto

### Código
- **Linhas de código:** ~18.000+
- **Módulos implementados:** 7 (Core: 5, Shared: 1, Workshops: 1)
- **Módulos planejados:** 15
- **Testes:** E2E implementados e completamente tipados
- **Qualidade:** 0 erros, 0 warnings de linting
- **Type Safety:** 100% (sem `any` desnecessário)

### Documentação
- **Documentos:** 20+
- **Páginas:** 500+
- **Status:** Completa e organizada

### Funcionalidades
- **Autenticação:** ✅ 100%
- **Multi-tenant:** ✅ 100%
- **Onboarding:** ✅ 100%
- **Billing:** ✅ 100%
- **Email:** ✅ 100%
- **Feature Flags:** ✅ 100%
- **Customers:** ✅ 100%
- **Qualidade de Código:** ✅ 100% (0 erros, 0 warnings)
- **Type Safety:** ✅ 100%
- **Outras Features:** 📋 0% (planejado)

---

## 🔗 Links Úteis

- **Swagger:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/health/status`
- **Documentação:** `docs/README.md`

---

**Última atualização:** 2024-12-01  
**Versão:** 1.1.0  
**Status:** 🟢 Em desenvolvimento ativo - Código Limpo e Type-Safe

### 🎯 Conquistas Recentes

- ✅ **Zero warnings de linting** (reduzido de 93 para 0)
- ✅ **100% type-safe** (sem `any` desnecessário)
- ✅ **Módulo Customers implementado** com testes completos
- ✅ **ESLint configurado** para bloquear `any` explicitamente
- ✅ **Testes E2E completamente tipados**
- ✅ **Utilitários de tratamento de erros** padronizados
