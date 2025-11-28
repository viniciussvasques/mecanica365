# Planejamento Detalhado - Módulos Tenants e Billing

## 📋 Status Atual

### Módulos Registrados no AppModule:
- ✅ **TenantsModule** - Registrado
- ✅ **AuthModule** - Registrado  
- ✅ **UsersModule** - Registrado
- ❌ **BillingModule** - Pendente

---

## 🏢 Módulo Tenants - Planejamento Completo

### Funcionalidades Atuais (Básico):
- ✅ Buscar tenant por subdomain
- ✅ Buscar tenant por ID
- ✅ Incluir subscription no retorno

### Funcionalidades a Implementar:

#### 1. **Provisionamento Automático** (Prioridade Alta)
- **Criar tenant automaticamente** quando:
  - Usuário se registra no sistema
  - Webhook do Stripe cria novo customer
  - API externa solicita (parceiros)
  
- **Fluxo Automático:**
  ```
  1. Validar dados (CNPJ, subdomain único)
  2. Criar Tenant (status: 'pending')
  3. Criar Subscription (plan: 'workshops_starter', status: 'trial')
  4. Criar usuário admin padrão
  5. Enviar email de boas-vindas
  6. Ativar tenant (status: 'active')
  ```

#### 2. **Provisionamento Manual** (Prioridade Alta)
- **Endpoints para Admin:**
  - `POST /api/tenants` - Criar tenant manualmente
  - `PATCH /api/tenants/:id` - Atualizar tenant
  - `POST /api/tenants/:id/activate` - Ativar tenant
  - `POST /api/tenants/:id/suspend` - Suspender tenant
  - `POST /api/tenants/:id/cancel` - Cancelar tenant
  - `GET /api/tenants` - Listar todos (admin only)

#### 3. **Validações e Regras de Negócio:**
- CNPJ válido e único
- Subdomain único e válido (apenas letras, números, hífen)
- Verificar disponibilidade de subdomain
- Status do tenant afeta acesso (suspended = bloqueado)

#### 4. **Integração com Billing:**
- Ao criar tenant, criar subscription automática
- Ao suspender tenant, pausar subscription
- Ao cancelar tenant, cancelar subscription

---

## 💳 Módulo Billing - Planejamento Completo

### Estrutura Baseada no Schema:

O schema já tem `Subscription` model com:
- ✅ Planos: `workshops_starter`, `workshops_professional`, `workshops_enterprise`
- ✅ Status: `active`, `cancelled`, `past_due`, `suspended`
- ✅ Feature flags: `activeFeatures` (String[])
- ✅ Limites: `serviceOrdersLimit`, `partsLimit`
- ✅ Stripe: `stripeSubscriptionId`, `stripeCustomerId`
- ✅ Billing cycle: `monthly`, `annual`

### Funcionalidades a Implementar:

#### 1. **Gerenciamento de Assinaturas** (Prioridade Alta)

**Endpoints:**
- `GET /api/billing/subscription` - Obter subscription atual do tenant
- `GET /api/billing/plans` - Listar planos disponíveis
- `POST /api/billing/subscription/upgrade` - Upgrade de plano
- `POST /api/billing/subscription/downgrade` - Downgrade de plano
- `POST /api/billing/subscription/cancel` - Cancelar assinatura
- `POST /api/billing/subscription/reactivate` - Reativar assinatura

**Fluxo de Upgrade:**
```
1. Validar plano atual vs novo plano
2. Calcular prorata (se necessário)
3. Criar checkout session no Stripe
4. Processar pagamento
5. Atualizar subscription no banco
6. Ativar novos features
7. Notificar usuário
```

#### 2. **Integração com Stripe** (Prioridade Alta)

**Webhooks a Implementar:**
- `customer.subscription.created` - Nova assinatura
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada
- `invoice.payment_succeeded` - Pagamento bem-sucedido
- `invoice.payment_failed` - Pagamento falhou
- `customer.subscription.trial_will_end` - Trial acabando

**Endpoints:**
- `POST /api/billing/webhooks/stripe` - Webhook handler
- `GET /api/billing/invoices` - Listar invoices
- `GET /api/billing/invoices/:id` - Detalhes do invoice

#### 3. **Feature Flags Baseado em Plano** (Prioridade Alta)

**Sistema de Features:**
```typescript
enum Feature {
  // Starter
  BASIC_SERVICE_ORDERS = 'basic_service_orders',
  BASIC_CUSTOMERS = 'basic_customers',
  
  // Professional
  ADVANCED_REPORTS = 'advanced_reports',
  MULTIPLE_LOCATIONS = 'multiple_locations',
  API_ACCESS = 'api_access',
  
  // Enterprise
  WHITE_LABEL = 'white_label',
  PRIORITY_SUPPORT = 'priority_support',
  CUSTOM_INTEGRATIONS = 'custom_integrations',
}
```

**Guard/Decorator:**
```typescript
@RequireFeature(Feature.ADVANCED_REPORTS)
@Get('reports/advanced')
async getAdvancedReports() { ... }
```

#### 4. **Limites por Plano** (Prioridade Alta)

**Limites Configurados:**
- **Starter:**
  - Service Orders: 50/mês
  - Parts: 100 itens
  - Users: 3 usuários
  
- **Professional:**
  - Service Orders: 500/mês
  - Parts: 1000 itens
  - Users: 10 usuários
  
- **Enterprise:**
  - Service Orders: Ilimitado
  - Parts: Ilimitado
  - Users: Ilimitado

**Middleware/Guard:**
- Verificar limites antes de criar recursos
- Retornar erro 429 (Too Many Requests) se exceder
- Dashboard com uso atual vs limite

#### 5. **Módulos Separados por Plano** (Prioridade Média)

**Estrutura Sugerida:**
```
modules/
├── core/
│   ├── auth/          ✅ Sempre ativo
│   ├── users/         ✅ Sempre ativo
│   ├── tenants/       ✅ Sempre ativo
│   └── billing/       ✅ Sempre ativo
│
├── workshops/
│   ├── service-orders/  ✅ Starter+
│   ├── customers/      ✅ Starter+
│   ├── appointments/   ✅ Professional+
│   ├── parts/          ✅ Professional+
│   ├── invoicing/      ✅ Professional+
│   └── reports/        ✅ Enterprise+
│
└── enterprise/
    ├── multi-location/  ✅ Enterprise only
    ├── white-label/     ✅ Enterprise only
    └── custom-integrations/ ✅ Enterprise only
```

**Implementação:**
- Guard que verifica plano antes de acessar módulo
- Retornar erro 403 com mensagem: "Upgrade para Professional para acessar este módulo"

#### 6. **Trial e Onboarding** (Prioridade Média)

**Fluxo de Trial:**
- Novo tenant começa com trial de 14 dias
- Trial inclui plano Professional
- Após trial, downgrade automático para Starter
- Notificações: 7 dias, 3 dias, 1 dia antes do fim

**Endpoints:**
- `GET /api/billing/trial` - Status do trial
- `POST /api/billing/trial/extend` - Estender trial (admin only)

---

## 🎯 Sugestões de Implementação

### 1. **Ordem de Implementação Recomendada:**

**Fase 1 - Tenants Completo:**
1. CRUD completo de Tenants (manual)
2. Provisionamento automático
3. Validações e regras de negócio
4. Integração básica com Billing

**Fase 2 - Billing Básico:**
1. Gerenciamento de Subscription (CRUD)
2. Feature flags básico
3. Limites por plano
4. Guard de verificação de plano

**Fase 3 - Stripe Integration:**
1. Integração com Stripe SDK
2. Webhooks
3. Checkout sessions
4. Invoices

**Fase 4 - Avançado:**
1. Upgrade/downgrade com prorata
2. Trial management
3. Módulos separados por plano
4. Dashboard de uso

### 2. **Arquitetura Sugerida:**

```
billing/
├── billing.module.ts
├── billing.service.ts
├── billing.controller.ts
├── subscription.service.ts      # Gerenciamento de subscriptions
├── stripe.service.ts            # Integração com Stripe
├── feature-flags.service.ts     # Gerenciamento de features
├── limits.service.ts            # Verificação de limites
├── guards/
│   ├── feature.guard.ts        # Verificar feature
│   ├── plan.guard.ts           # Verificar plano mínimo
│   └── limit.guard.ts          # Verificar limite
├── decorators/
│   ├── require-feature.decorator.ts
│   └── require-plan.decorator.ts
└── dto/
    ├── create-subscription.dto.ts
    ├── upgrade-plan.dto.ts
    └── subscription-response.dto.ts
```

### 3. **Configuração de Planos (Sugestão):**

```typescript
// config/plans.config.ts
export const PLANS_CONFIG = {
  workshops_starter: {
    name: 'Starter',
    price: { monthly: 99, annual: 990 },
    features: [
      Feature.BASIC_SERVICE_ORDERS,
      Feature.BASIC_CUSTOMERS,
    ],
    limits: {
      serviceOrders: 50,
      parts: 100,
      users: 3,
    },
  },
  workshops_professional: {
    name: 'Professional',
    price: { monthly: 299, annual: 2990 },
    features: [
      ...PLANS_CONFIG.workshops_starter.features,
      Feature.ADVANCED_REPORTS,
      Feature.API_ACCESS,
    ],
    limits: {
      serviceOrders: 500,
      parts: 1000,
      users: 10,
    },
  },
  workshops_enterprise: {
    name: 'Enterprise',
    price: { monthly: 999, annual: 9990 },
    features: [
      ...PLANS_CONFIG.workshops_professional.features,
      Feature.WHITE_LABEL,
      Feature.PRIORITY_SUPPORT,
      Feature.CUSTOM_INTEGRATIONS,
    ],
    limits: {
      serviceOrders: null, // Ilimitado
      parts: null,
      users: null,
    },
  },
};
```

---

## ✅ Checklist de Implementação

### Módulo Tenants:
- [ ] CRUD completo (Create, Read, Update, Delete)
- [ ] Provisionamento automático
- [ ] Provisionamento manual (admin)
- [ ] Validações (CNPJ, subdomain)
- [ ] Ativar/Suspender/Cancelar
- [ ] Integração com Billing
- [ ] Testes unitários
- [ ] Testes E2E
- [ ] Documentação Swagger

### Módulo Billing:
- [ ] CRUD de Subscription
- [ ] Upgrade/Downgrade de plano
- [ ] Feature flags system
- [ ] Limites por plano
- [ ] Guards e Decorators
- [ ] Integração Stripe (básica)
- [ ] Webhooks Stripe
- [ ] Trial management
- [ ] Dashboard de uso
- [ ] Testes unitários
- [ ] Testes E2E
- [ ] Documentação Swagger

---

## 📝 Notas Importantes

1. **Tenants deve ser automático MAS ter opções manuais** - ✅ Planejado
2. **Billing com assinatura, upgrade, módulos separados** - ✅ Planejado
3. **Tudo baseado no schema existente** - ✅ Schema já tem tudo necessário
4. **Integração Stripe opcional** - Pode começar sem Stripe e adicionar depois
5. **Feature flags permitem ativar/desativar funcionalidades por plano** - ✅ Planejado

---

**Status:** Planejamento completo e pronto para implementação! 🚀

