# Módulo Onboarding

**Status:** ✅ Completo e Funcional

## 📋 Visão Geral

O módulo de Onboarding gerencia o processo completo de registro de novos tenants, incluindo:
- Registro inicial do tenant (status: pending)
- Criação de sessão de checkout no Stripe
- Processamento de webhooks do Stripe
- Ativação automática do tenant após pagamento
- Criação automática de subscription e usuário admin
- Envio de email de boas-vindas

## 🏗️ Arquitetura

### Fluxo Completo

```
1. Cliente preenche formulário de registro
   ↓
2. POST /api/onboarding/register
   → Cria tenant com status PENDING
   → Retorna tenantId e subdomain
   ↓
3. POST /api/onboarding/checkout
   → Cria sessão de checkout no Stripe
   → Retorna URL de checkout
   ↓
4. Cliente completa pagamento no Stripe
   ↓
5. Stripe envia webhook checkout.session.completed
   ↓
6. POST /api/onboarding/webhooks/stripe
   → Ativa tenant (PENDING → ACTIVE)
   → Cria/atualiza subscription
   → Cria usuário admin
   → Envia email de boas-vindas
```

## 📦 Componentes

### Service: `OnboardingService`

**Métodos principais:**

1. **`checkPendingTenant(document, email)`**
   - Verifica se existe tenant pendente com mesmo documento
   - Retorna `{ tenantId, subdomain, exists }` ou `null`

2. **`register(createOnboardingDto)`**
   - Cria novo tenant com status `PENDING`
   - Se já existir tenant pendente, retorna o existente
   - Retorna `{ tenantId, subdomain }`

3. **`createCheckoutSession(createCheckoutDto)`**
   - Cria sessão de checkout no Stripe
   - Vincula sessão ao tenant existente
   - Retorna `{ sessionId, url }`

4. **`handleCheckoutCompleted(session)`**
   - Processa webhook do Stripe
   - Ativa tenant (PENDING → ACTIVE)
   - Cria/atualiza subscription
   - Cria usuário admin
   - Envia email de boas-vindas

### Controller: `OnboardingController`

**Endpoints:**

- `POST /api/onboarding/register` - Registrar novo tenant (público)
- `POST /api/onboarding/check-status` - Verificar tenant pendente (público)
- `POST /api/onboarding/checkout` - Criar sessão de checkout (público)
- `POST /api/onboarding/webhooks/stripe` - Webhook do Stripe (público)

## 🔐 Segurança

- ✅ Rotas públicas marcadas com `@Public()`
- ✅ Validação de DTOs com `class-validator`
- ✅ Verificação de assinatura do webhook do Stripe
- ✅ Idempotência no processamento de webhooks
- ✅ Validação de status do tenant antes de processar

## 📝 DTOs

### `CreateOnboardingDto`
```typescript
{
  name: string;              // Nome da oficina
  email: string;             // Email do admin
  documentType: 'cpf' | 'cnpj';
  document: string;          // CPF ou CNPJ (apenas números)
  subdomain: string;        // Subdomain único
  plan: TenantPlan;          // Plano escolhido
  password?: string;         // Senha opcional (gerada se não fornecido)
}
```

### `CreateCheckoutDto`
```typescript
{
  tenantId: string;          // ID do tenant pendente
  plan: TenantPlan;          // Plano
  billingCycle?: 'monthly' | 'annual';
}
```

### `CheckTenantStatusDto`
```typescript
{
  document: string;          // CPF ou CNPJ
  email: string;            // Email
}
```

## 🧪 Testes

### Testes Unitários
- ✅ `onboarding.service.spec.ts` - Cobertura completa do serviço
- ✅ Testes de `checkPendingTenant`
- ✅ Testes de `register`
- ✅ Testes de `createCheckoutSession`
- ✅ Testes de `handleCheckoutCompleted`

### Testes E2E
- ✅ `onboarding.e2e-spec.ts` - Testes end-to-end
- ✅ Teste de registro
- ✅ Teste de verificação de status
- ✅ Teste de checkout

## 🔄 Integrações

### Stripe
- ✅ Criação de checkout sessions
- ✅ Processamento de webhooks
- ✅ Vinculação de customer e subscription

### Email Service
- ✅ Envio de email de boas-vindas
- ✅ Credenciais de acesso no email
- ✅ Link de login personalizado

## 📊 Estados do Tenant

- **PENDING**: Tenant criado, aguardando pagamento
- **ACTIVE**: Tenant ativado após pagamento confirmado
- **SUSPENDED**: Tenant suspenso (futuro)
- **CANCELLED**: Tenant cancelado (futuro)

## 🚀 Uso

### 1. Registrar Tenant

```typescript
POST /api/onboarding/register
{
  "name": "Oficina do João",
  "email": "joao@oficina.com",
  "documentType": "cnpj",
  "document": "12345678000199",
  "subdomain": "oficina-joao",
  "plan": "workshops_starter",
  "password": "MinhaSenha123" // Opcional
}

Response:
{
  "tenantId": "uuid",
  "subdomain": "oficina-joao"
}
```

### 2. Criar Checkout

```typescript
POST /api/onboarding/checkout
{
  "tenantId": "uuid",
  "plan": "workshops_starter",
  "billingCycle": "monthly"
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### 3. Verificar Status

```typescript
POST /api/onboarding/check-status
{
  "document": "12345678000199",
  "email": "joao@oficina.com"
}

Response:
{
  "tenantId": "uuid",
  "subdomain": "oficina-joao",
  "exists": true
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASS=senha_de_app
```

### Preços dos Planos

Definidos em `onboarding.service.ts`:

```typescript
workshops_starter: {
  monthly: 49.9,
  annual: 499.0,
}
workshops_professional: {
  monthly: 149.9,
  annual: 1499.0,
}
workshops_enterprise: {
  monthly: 499.9,
  annual: 4999.0,
}
```

## 🔍 Troubleshooting

### Webhook não está sendo recebido
- Verificar `STRIPE_WEBHOOK_SECRET` configurado
- Verificar URL do webhook no Stripe Dashboard
- Verificar se `rawBody` está habilitado no NestJS

### Email não está sendo enviado
- Verificar configuração SMTP no `.env`
- Verificar logs do EmailService
- Em desenvolvimento, emails são apenas logados se SMTP não configurado

### Tenant não está sendo ativado
- Verificar se webhook foi recebido (logs)
- Verificar se tenant está com status PENDING
- Verificar se metadata do Stripe contém tenantId

## 📚 Referências

- [Stripe Checkout Sessions](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Nodemailer Documentation](https://nodemailer.com/)

---

**Última atualização:** 2024-11-28  
**Versão:** 1.0.0

