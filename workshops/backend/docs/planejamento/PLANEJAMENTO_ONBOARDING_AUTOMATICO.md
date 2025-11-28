# Planejamento - Onboarding Automático Completo

## 🎯 Objetivo

Implementar fluxo **100% automático** de onboarding onde:
1. Cliente escolhe plano no site
2. Preenche dados (nome, email, CNPJ/CPF, subdomain)
3. Paga via Stripe
4. Backend recebe confirmação (webhook)
5. Sistema cria tudo automaticamente:
   - Tenant
   - Subscription (billing)
   - Usuário admin
   - Envia email de boas-vindas
   - Ativa tenant

---

## 📋 Fluxo Completo Proposto

### **Opção 1: Senha Aleatória (Recomendada para MVP)**

```
1. Cliente → Frontend: Escolhe plano, preenche dados
2. Frontend → Backend: POST /api/onboarding/checkout
   - Dados: { name, email, documentType, document, subdomain, plan, billingCycle }
3. Backend → Stripe: Cria Checkout Session
   - Metadata: { tenantEmail, tenantName, subdomain, plan }
4. Cliente → Stripe: Completa pagamento
5. Stripe → Backend: Webhook checkout.session.completed
6. Backend processa webhook:
   ✅ Valida pagamento
   ✅ Cria Tenant (status: 'active')
   ✅ Cria Subscription (status: 'active')
   ✅ Gera senha aleatória segura
   ✅ Cria User (email do cliente, role: 'admin')
   ✅ Envia email de boas-vindas com credenciais
   ✅ Loga evento
7. Cliente recebe email com:
   - Link de acesso
   - Email de login
   - Senha temporária
   - Instruções para primeiro acesso
```

### **Opção 2: Cliente Define Senha (Mais Seguro)**

```
1. Cliente → Frontend: Escolhe plano, preenche dados + senha
2. Frontend → Backend: POST /api/onboarding/checkout
   - Dados: { name, email, password, documentType, document, subdomain, plan }
3. Backend → Stripe: Cria Checkout Session
   - Metadata: { tenantEmail, tenantName, subdomain, plan }
   - Salva senha temporariamente (criptografada) ou usa Stripe metadata
4. Cliente → Stripe: Completa pagamento
5. Stripe → Backend: Webhook checkout.session.completed
6. Backend processa webhook:
   ✅ Valida pagamento
   ✅ Cria Tenant (status: 'active')
   ✅ Cria Subscription (status: 'active')
   ✅ Cria User (email do cliente, senha fornecida, role: 'admin')
   ✅ Envia email de boas-vindas
   ✅ Loga evento
7. Cliente recebe email com:
   - Link de acesso
   - Email de login
   - Confirmação de cadastro
```

**Recomendação:** Implementar **Opção 1** primeiro (mais simples), depois adicionar **Opção 2** como melhoria.

---

## 🏗️ Arquitetura Técnica

### **1. Módulo de Email (EmailService)**

**Dependências:**
- `@nestjs-modules/mailer` ou `nodemailer`
- Templates: `handlebars` ou `ejs`

**Funcionalidades:**
- Enviar email de boas-vindas
- Enviar credenciais (senha temporária)
- Enviar confirmação de pagamento
- Templates HTML responsivos

**Estrutura:**
```
src/modules/shared/email/
├── email.module.ts
├── email.service.ts
├── templates/
│   ├── welcome.hbs
│   ├── credentials.hbs
│   └── payment-confirmed.hbs
└── dto/
    └── send-email.dto.ts
```

### **2. Módulo de Onboarding**

**Funcionalidades:**
- Criar checkout session no Stripe
- Processar webhooks do Stripe
- Orquestrar criação automática (tenant + subscription + user)
- Geração de senha aleatória

**Estrutura:**
```
src/modules/core/onboarding/
├── onboarding.module.ts
├── onboarding.service.ts
├── onboarding.controller.ts
├── dto/
│   ├── create-checkout.dto.ts
│   └── webhook-event.dto.ts
└── utils/
    └── password-generator.util.ts
```

### **3. Integração Stripe**

**Dependências:**
- `stripe` (SDK oficial)

**Endpoints:**
- `POST /api/onboarding/checkout` - Criar sessão de checkout
- `POST /api/onboarding/webhooks/stripe` - Webhook handler

**Webhooks a processar:**
- `checkout.session.completed` - Pagamento confirmado
- `customer.subscription.created` - Assinatura criada
- `customer.subscription.updated` - Assinatura atualizada
- `invoice.payment_succeeded` - Pagamento bem-sucedido
- `invoice.payment_failed` - Pagamento falhou

---

## 📝 DTOs e Validações

### **CreateCheckoutDto**
```typescript
{
  name: string;              // Nome da oficina/empresa
  email: string;            // Email do cliente (será admin)
  documentType: 'cnpj' | 'cpf';
  document: string;         // CNPJ ou CPF (apenas números)
  subdomain: string;        // Subdomain desejado
  plan: 'workshops_starter' | 'workshops_professional' | 'workshops_enterprise';
  billingCycle: 'monthly' | 'annual';
  password?: string;        // Opcional: senha do cliente (Opção 2)
}
```

### **Validações:**
- Email válido e único
- CNPJ/CPF válido e único
- Subdomain único e válido (regex: `^[a-z0-9-]+$`)
- Plano válido
- Senha forte (se fornecida): mínimo 8 caracteres, 1 maiúscula, 1 número

---

## 🔄 Fluxo de Processamento do Webhook

### **checkout.session.completed**

```typescript
async handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const metadata = session.metadata;
  
  // 1. Validar dados do metadata
  const { tenantEmail, tenantName, subdomain, plan, documentType, document } = metadata;
  
  // 2. Verificar se tenant já existe (idempotência)
  const existingTenant = await this.prisma.tenant.findUnique({
    where: { subdomain }
  });
  
  if (existingTenant) {
    this.logger.warn(`Tenant já existe: ${subdomain}`);
    return;
  }
  
  // 3. Criar Tenant
  const tenant = await this.tenantsService.create({
    name: tenantName,
    documentType,
    document,
    subdomain,
    plan,
    status: 'active', // Ativar imediatamente após pagamento
  });
  
  // 4. Atualizar Subscription com dados do Stripe
  await this.billingService.update(tenant.id, {
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
  });
  
  // 5. Gerar senha aleatória (se não fornecida)
  const password = metadata.password 
    ? await this.hashPassword(metadata.password)
    : await this.generateRandomPassword();
  
  // 6. Criar User Admin
  const user = await this.usersService.create(tenant.id, {
    email: tenantEmail,
    name: tenantName,
    password: password,
    role: 'admin',
    isActive: true,
  });
  
  // 7. Enviar email de boas-vindas
  await this.emailService.sendWelcomeEmail({
    to: tenantEmail,
    name: tenantName,
    subdomain,
    email: tenantEmail,
    password: password, // Senha em texto (não hasheada)
    loginUrl: `${process.env.FRONTEND_URL}/login?subdomain=${subdomain}`,
  });
  
  // 8. Log
  this.logger.log(`Onboarding completo para tenant: ${subdomain}`);
}
```

---

## 📧 Templates de Email

### **Email de Boas-Vindas**
- Assunto: "Bem-vindo ao Mecânica365! Suas credenciais de acesso"
- Conteúdo:
  - Mensagem de boas-vindas
  - Link de acesso
  - Credenciais (email e senha)
  - Instruções para primeiro login
  - Link para alterar senha

---

## 🔐 Segurança

### **Geração de Senha Aleatória**
- Mínimo 12 caracteres
- Incluir: maiúsculas, minúsculas, números, símbolos
- Usar `crypto.randomBytes` ou biblioteca segura

### **Webhook Stripe**
- Validar assinatura do webhook (Stripe signature)
- Verificar idempotência (evitar processar 2x)
- Logs de auditoria

### **Dados Sensíveis**
- Senha nunca em logs
- Metadata do Stripe limitado (não enviar senha via metadata)
- Email enviado apenas após confirmação de pagamento

---

## 🧪 Testes

### **Unitários:**
- Geração de senha aleatória
- Validação de DTOs
- Processamento de webhook (mocks)

### **E2E:**
- Fluxo completo de checkout
- Webhook do Stripe (simulado)
- Criação automática de tenant + subscription + user
- Envio de email (mock)

### **Manuais:**
- Teste com Stripe Test Mode
- Verificar email recebido
- Testar login com credenciais

---

## 📦 Dependências a Adicionar

```json
{
  "dependencies": {
    "stripe": "^14.0.0",
    "@nestjs-modules/mailer": "^2.0.0",
    "nodemailer": "^6.9.0",
    "handlebars": "^4.7.8"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.0"
  }
}
```

---

## 🚀 Ordem de Implementação

1. **EmailService** (Módulo de email)
   - Configurar Nodemailer
   - Criar templates
   - Implementar envio de email

2. **Stripe Integration** (Básico)
   - Instalar SDK
   - Configurar chaves (env)
   - Criar checkout session

3. **Onboarding Module** (Estrutura)
   - DTOs
   - Service básico
   - Controller

4. **Webhook Handler**
   - Validar assinatura
   - Processar eventos
   - Orquestrar criação automática

5. **Testes e Documentação**
   - Unitários
   - E2E
   - Documentação Swagger
   - Atualizar CONTEXTO_GERAL.md

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências (Stripe, Nodemailer)
- [ ] Criar EmailService
- [ ] Criar templates de email
- [ ] Configurar variáveis de ambiente (Stripe keys, SMTP)
- [ ] Criar OnboardingModule
- [ ] Implementar endpoint de checkout
- [ ] Implementar webhook handler
- [ ] Implementar geração de senha aleatória
- [ ] Implementar fluxo automático completo
- [ ] Adicionar validações e tratamento de erros
- [ ] Criar testes unitários
- [ ] Criar testes E2E
- [ ] Documentar no Swagger
- [ ] Atualizar CONTEXTO_GERAL.md
- [ ] Testes manuais com Stripe Test Mode

---

## 💡 Melhorias Futuras

1. **Opção 2:** Permitir cliente definir senha durante checkout
2. **Trial:** Período de teste gratuito (7-14 dias)
3. **Onboarding Wizard:** Passo a passo após primeiro login
4. **Notificações:** SMS ou WhatsApp para credenciais
5. **Analytics:** Tracking de conversão (checkout → ativação)

---

**Próximo passo:** Começar pela implementação do EmailService e depois Stripe integration.


