# Sistema de Emails e Webhooks - Mecânica365

**Última atualização:** 28/11/2025  
**Status:** ✅ Implementado e Testado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema de Emails](#arquitetura-do-sistema-de-emails)
3. [Templates de Email](#templates-de-email)
4. [Serviços de Email](#serviços-de-email)
5. [Sistema de Disparo em Massa](#sistema-de-disparo-em-massa)
6. [Webhooks do Stripe](#webhooks-do-stripe)
7. [Configuração SMTP](#configuração-smtp)
8. [Testes](#testes)
9. [API Endpoints](#api-endpoints)

---

## 🎯 Visão Geral

O sistema de emails do Mecânica365 foi desenvolvido para comunicar profissionalmente com os clientes em todas as situações relacionadas a pagamentos, assinaturas e eventos do sistema. O sistema inclui:

- ✅ **8 templates profissionais** de email (HTML + texto)
- ✅ **Sistema de disparo em massa** com personalização
- ✅ **Tratamento completo de webhooks** do Stripe
- ✅ **Configuração flexível** de SMTP
- ✅ **Painel administrativo** para gerenciamento de emails

---

## 🏗️ Arquitetura do Sistema de Emails

### Estrutura de Arquivos

```
src/modules/shared/email/
├── email.module.ts                    # Módulo principal
├── email.service.ts                   # Serviço principal de envio
├── email-templates.service.ts         # Geração de templates HTML/texto
├── bulk-email.service.ts             # Disparo em massa
├── email.controller.ts               # Endpoints públicos
├── admin-email.controller.ts         # Endpoints administrativos
├── interfaces/
│   └── email-data.interfaces.ts     # Interfaces TypeScript
└── dto/
    ├── send-bulk-email.dto.ts        # DTO para disparo em massa
    └── bulk-email-response.dto.ts    # Resposta do disparo
```

### Fluxo de Envio de Email

```
1. Evento (Webhook/Service) 
   ↓
2. EmailService.sendEmail()
   ↓
3. EmailTemplatesService.getTemplate()
   ↓
4. Nodemailer (SMTP)
   ↓
5. Cliente recebe email
```

---

## 📧 Templates de Email

### 1. Email de Boas-Vindas (`sendWelcomeEmail`)

**Quando é enviado:**
- Após pagamento bem-sucedido e ativação do tenant

**Conteúdo:**
- Mensagem de boas-vindas personalizada
- Credenciais de acesso (email e senha)
- Link de login
- Instruções para primeiro acesso

**Variáveis:**
- `name`: Nome do usuário
- `subdomain`: Subdomínio do tenant
- `email`: Email de login
- `password`: Senha temporária
- `loginUrl`: URL de login

---

### 2. Email de Pagamento Falhado (`sendPaymentFailedEmail`)

**Quando é enviado:**
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`
- `charge.failed`
- `invoice.payment_failed`

**Conteúdo:**
- Notificação de falha no pagamento
- Valor da transação
- Método de pagamento
- Motivo da falha
- Link para tentar novamente
- Link de suporte

**Variáveis:**
- `name`, `subdomain`
- `amount`: Valor em centavos
- `currency`: Moeda (brl, usd)
- `paymentMethod`: Método usado
- `failureReason`: Motivo da falha
- `retryUrl`: URL para tentar novamente
- `supportUrl`: URL de suporte

---

### 3. Email de Assinatura Cancelada (`sendSubscriptionCancelledEmail`)

**Quando é enviado:**
- `customer.subscription.deleted`

**Conteúdo:**
- Confirmação de cancelamento
- Plano cancelado
- Data de cancelamento
- Link para reativar
- Link de suporte

**Variáveis:**
- `name`, `subdomain`
- `plan`: Nome do plano
- `cancellationDate`: Data de cancelamento
- `reactivateUrl`: URL para reativar
- `supportUrl`: URL de suporte

---

### 4. Email de Assinatura Atualizada (`sendSubscriptionUpdatedEmail`)

**Quando é enviado:**
- `customer.subscription.updated`

**Conteúdo:**
- Confirmação de atualização
- Plano antigo e novo
- Próxima data de cobrança
- Valor da nova assinatura

**Variáveis:**
- `name`, `subdomain`
- `oldPlan`: Plano anterior
- `newPlan`: Novo plano
- `billingCycle`: Ciclo (monthly/annual)
- `nextBillingDate`: Próxima cobrança
- `amount`: Valor em centavos
- `currency`: Moeda
- `loginUrl`: URL de login

---

### 5. Email de Pagamento de Fatura Bem-Sucedido (`sendInvoicePaymentSucceededEmail`)

**Quando é enviado:**
- `invoice.payment_succeeded`

**Conteúdo:**
- Confirmação de pagamento
- Número da fatura
- Valor pago
- Link para visualizar fatura
- Próxima data de cobrança

**Variáveis:**
- `name`, `subdomain`
- `amount`: Valor pago em centavos
- `currency`: Moeda
- `invoiceNumber`: Número da fatura
- `invoiceUrl`: URL da fatura
- `nextBillingDate`: Próxima cobrança
- `loginUrl`: URL de login

---

### 6. Email de Fatura Próxima (`sendInvoiceUpcomingEmail`)

**Quando é enviado:**
- `invoice.upcoming` (7 dias antes)

**Conteúdo:**
- Aviso de fatura próxima
- Valor a ser cobrado
- Data de vencimento
- Método de pagamento
- Link para atualizar método

**Variáveis:**
- `name`, `subdomain`
- `amount`: Valor em centavos
- `currency`: Moeda
- `dueDate`: Data de vencimento
- `invoiceUrl`: URL da fatura
- `paymentMethod`: Método de pagamento
- `loginUrl`: URL de login

---

### 7. Email de Trial Terminando (`sendTrialEndingEmail`)

**Quando é enviado:**
- `customer.subscription.trial_will_end` (3 dias antes)

**Conteúdo:**
- Aviso de término do trial
- Data de término
- Plano atual
- Link para fazer upgrade
- Link de login

**Variáveis:**
- `name`, `subdomain`
- `trialEndDate`: Data de término
- `plan`: Plano atual
- `upgradeUrl`: URL para fazer upgrade
- `loginUrl`: URL de login

---

### 8. Email de Conta Suspensa (`sendAccountSuspendedEmail`)

**Quando é enviado:**
- Quando tenant é suspenso manualmente ou por falta de pagamento

**Conteúdo:**
- Notificação de suspensão
- Motivo da suspensão
- Link para reativar
- Link de suporte

**Variáveis:**
- `name`, `subdomain`
- `reason`: Motivo da suspensão
- `reactivateUrl`: URL para reativar
- `supportUrl`: URL de suporte

---

## 🔧 Serviços de Email

### EmailService

Serviço principal responsável por:
- Configuração do SMTP (Nodemailer)
- Envio de emails individuais
- Verificação de conexão SMTP
- Tratamento de erros

**Métodos principais:**
- `sendWelcomeEmail(data)`: Email de boas-vindas
- `sendPaymentFailedEmail(data)`: Pagamento falhado
- `sendSubscriptionCancelledEmail(data)`: Cancelamento
- `sendSubscriptionUpdatedEmail(data)`: Atualização
- `sendInvoicePaymentSucceededEmail(data)`: Pagamento bem-sucedido
- `sendInvoiceUpcomingEmail(data)`: Fatura próxima
- `sendTrialEndingEmail(data)`: Trial terminando
- `sendAccountSuspendedEmail(data)`: Conta suspensa
- `sendEmail(to, subject, html, text)`: Método genérico

### EmailTemplatesService

Serviço responsável por gerar templates HTML e texto:
- Templates profissionais e responsivos
- Suporte a variáveis personalizadas
- Versão HTML e texto para cada template

**Métodos:**
- `getWelcomeEmailTemplate(data)`: HTML de boas-vindas
- `getWelcomeEmailTextTemplate(data)`: Texto de boas-vindas
- `getPaymentFailedEmailTemplate(data)`: HTML de pagamento falhado
- `getPaymentFailedEmailTextTemplate(data)`: Texto de pagamento falhado
- ... (similar para todos os templates)

---

## 📨 Sistema de Disparo em Massa

### BulkEmailService

Serviço especializado para envio de emails em massa com:
- ✅ Processamento em lotes (10 emails por vez)
- ✅ Personalização por destinatário
- ✅ Substituição de variáveis (`{{name}}`, `{{email}}`, `{{customData.key}}`)
- ✅ Retry automático em caso de falha
- ✅ Estatísticas detalhadas (total, enviados, falhas, erros)

**Variáveis suportadas:**
- `{{name}}`: Nome do destinatário
- `{{email}}`: Email do destinatário
- `{{customData.key}}`: Dados personalizados

**Exemplo de uso:**
```typescript
await bulkEmailService.sendBulkEmail({
  recipients: [
    { email: 'user1@test.com', name: 'User 1', customData: { company: 'ABC' } },
    { email: 'user2@test.com', name: 'User 2', customData: { company: 'XYZ' } },
  ],
  subject: 'Olá {{name}} da {{company}}',
  htmlContent: '<p>Olá {{name}}, bem-vindo da {{company}}!</p>',
  textContent: 'Olá {{name}}, bem-vindo da {{company}}!',
  fromName: 'Mecânica365',
});
```

---

## 🔔 Webhooks do Stripe

### Eventos Tratados

O sistema processa os seguintes eventos do Stripe:

#### 1. `checkout.session.completed`
- **Ação:** Ativa tenant, cria subscription, cria usuário admin, envia email de boas-vindas
- **Handler:** `handleCheckoutCompleted()`

#### 2. `checkout.session.async_payment_failed`
- **Ação:** Envia email de pagamento falhado
- **Handler:** `handleAsyncPaymentFailed()`

#### 3. `payment_intent.payment_failed`
- **Ação:** Envia email de pagamento falhado
- **Handler:** `handlePaymentIntentFailed()`

#### 4. `charge.failed`
- **Ação:** Envia email de pagamento falhado
- **Handler:** `handleChargeFailed()`
- **Nota:** Busca tenant via checkout session se não encontrar pelo customer ID

#### 5. `invoice.payment_failed`
- **Ação:** Envia email de pagamento falhado
- **Handler:** `handleInvoicePaymentFailed()`

#### 6. `invoice.payment_succeeded`
- **Ação:** Envia email de pagamento bem-sucedido
- **Handler:** `handleInvoicePaymentSucceeded()`

#### 7. `invoice.upcoming`
- **Ação:** Envia email de fatura próxima (7 dias antes)
- **Handler:** `handleInvoiceUpcoming()`

#### 8. `customer.subscription.deleted`
- **Ação:** Envia email de cancelamento
- **Handler:** `handleSubscriptionDeleted()`

#### 9. `customer.subscription.updated`
- **Ação:** Envia email de atualização
- **Handler:** `handleSubscriptionUpdated()`

#### 10. `customer.subscription.trial_will_end`
- **Ação:** Envia email de trial terminando (3 dias antes)
- **Handler:** `handleTrialEnding()`

### Busca de Tenant

O sistema implementa múltiplas estratégias para encontrar o tenant:

1. **Por Stripe Customer ID:** Busca na subscription
2. **Por Stripe Subscription ID:** Busca direta na subscription
3. **Por Checkout Session:** Busca sessions recentes e extrai `metadata.tenantId`
4. **Por Email do Billing:** Busca usuário pelo email do billing_details
5. **Por Tenant Pendente:** Busca tenant pendente mais recente

---

## ⚙️ Configuração SMTP

### Variáveis de Ambiente

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_SECURE=false
SMTP_REJECT_UNAUTHORIZED=false
SMTP_REPLY_TO=noreply@mecanica365.com
```

### Servidores SMTP Suportados

- ✅ **Mailcow** (configuração especial para self-signed certificates)
- ✅ **Gmail** (com app password)
- ✅ **Mailtrap** (desenvolvimento)
- ✅ **Brevo** (Sendinblue)
- ✅ **Mailjet**
- ✅ **SMTP2GO**

### Documentação de Configuração

- `SMTP_QUICK_SETUP.md`: Guia rápido para vários servidores
- `CONFIGURAR_GMAIL.txt`: Configuração específica do Gmail
- `SMTP_MAILCOW_SETUP.md`: Configuração do Mailcow
- `EVITAR_SPAM_MAILCOW.md`: Melhorar deliverability (SPF, DKIM, DMARC)

---

## 🧪 Testes

### Testes Unitários

#### EmailService (`email.service.spec.ts`)
- ✅ Envio de email de boas-vindas
- ✅ Tratamento de erros SMTP
- ✅ Comportamento quando SMTP não configurado

#### EmailTemplatesService (`email-templates.service.spec.ts`)
- ✅ Geração de todos os 8 templates HTML
- ✅ Geração de todos os 8 templates texto
- ✅ Substituição correta de variáveis

#### BulkEmailService (`bulk-email.service.spec.ts`)
- ✅ Envio para múltiplos destinatários
- ✅ Substituição de variáveis padrão
- ✅ Substituição de variáveis customizadas
- ✅ Processamento em lotes
- ✅ Tratamento de erros individuais
- ✅ Estatísticas corretas

#### OnboardingService - Webhooks (`onboarding-webhooks.spec.ts`)
- ✅ `handleChargeFailed`: Busca tenant e envia email
- ✅ `handleInvoicePaymentFailed`: Processa e envia email
- ✅ `handleInvoicePaymentSucceeded`: Processa e envia email
- ✅ `handleSubscriptionDeleted`: Processa e envia email
- ✅ `handleSubscriptionUpdated`: Processa e envia email

### Testes E2E

- ✅ Fluxo completo de registro → checkout → webhook → email
- ✅ Teste com Stripe Test Mode
- ✅ Verificação de emails recebidos

---

## 🔌 API Endpoints

### Endpoints Públicos

#### `POST /api/email/status`
Verifica status da conexão SMTP.

**Resposta:**
```json
{
  "connected": true,
  "host": "smtp.example.com",
  "port": 587
}
```

### Endpoints Administrativos

**Autenticação:** JWT Bearer Token  
**Permissão:** Role `admin`

#### `POST /api/admin/email/bulk`
Envia emails em massa.

**Request:**
```json
{
  "recipients": [
    {
      "email": "user@example.com",
      "name": "User Name",
      "customData": {
        "company": "ABC Corp"
      }
    }
  ],
  "subject": "Olá {{name}}",
  "htmlContent": "<p>Olá {{name}} da {{company}}</p>",
  "textContent": "Olá {{name}} da {{company}}",
  "fromName": "Mecânica365",
  "replyTo": "support@mecanica365.com"
}
```

**Response:**
```json
{
  "total": 10,
  "sent": 9,
  "failed": 1,
  "errors": [
    {
      "email": "invalid@example.com",
      "error": "Invalid email address"
    }
  ],
  "message": "Disparo concluído: 9 enviados, 1 falhas de 10 total"
}
```

#### `GET /api/admin/email/recipients`
Lista todos os destinatários disponíveis (tenants ativos).

**Response:**
```json
{
  "recipients": [
    {
      "email": "admin@tenant.com",
      "name": "Admin Name",
      "subdomain": "tenant-subdomain",
      "tenantId": "tenant-id"
    }
  ],
  "total": 1
}
```

#### `GET /api/admin/email/templates`
Lista todos os templates disponíveis com documentação.

**Response:**
```json
{
  "templates": [
    {
      "name": "welcome",
      "description": "Email de boas-vindas enviado após ativação",
      "variables": ["name", "subdomain", "email", "password", "loginUrl"]
    }
  ]
}
```

---

## 📊 Estatísticas e Monitoramento

### Logs

O sistema registra:
- ✅ Tentativas de envio (sucesso/falha)
- ✅ Erros SMTP detalhados
- ✅ Webhooks recebidos e processados
- ✅ Busca de tenants (sucesso/falha)

### Métricas

- Total de emails enviados
- Taxa de sucesso/falha
- Tempo médio de envio
- Erros por tipo

---

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ Validação de emails antes do envio
- ✅ Sanitização de conteúdo HTML
- ✅ Rate limiting (lotes de 10 emails)
- ✅ Autenticação JWT para endpoints admin
- ✅ Role-based access control (admin only)
- ✅ Logs sem informações sensíveis (senhas)

---

## 🚀 Melhorias Futuras

- [ ] Fila de emails (Bull/Redis) para processamento assíncrono
- [ ] Templates customizáveis por tenant
- [ ] A/B testing de templates
- [ ] Analytics de abertura e cliques
- [ ] Agendamento de emails
- [ ] Suporte a anexos
- [ ] Integração com serviços de email marketing (SendGrid, Mailchimp)

---

## 📚 Referências

- [Documentação Nodemailer](https://nodemailer.com/)
- [Documentação Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Guia de Deliverability](https://www.mailcow.email/)

---

**Última atualização:** 28/11/2025  
**Versão:** 1.0.0

