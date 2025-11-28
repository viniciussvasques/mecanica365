# 🔐 Configuração de Variáveis de Ambiente

## 📋 Passo a Passo

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Abra o arquivo `.env` e preencha as chaves:**

---

## 🔑 Chaves Obrigatórias

### **JWT_SECRET** (OBRIGATÓRIO)
- **O que é:** Chave secreta para assinar tokens JWT
- **Como gerar:**
  ```bash
  openssl rand -base64 32
  ```
- **Exemplo:** `JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

---

### **STRIPE_SECRET_KEY** (OBRIGATÓRIO para onboarding)
- **O que é:** Chave secreta da API do Stripe
- **Onde obter:** https://dashboard.stripe.com/apikeys
- **Desenvolvimento:** Use chaves de teste (começam com `sk_test_`)
- **Produção:** Use chaves de produção (começam com `sk_live_`)
- **Exemplo:** `STRIPE_SECRET_KEY=sk_test_51AbCdEf...`

---

### **STRIPE_WEBHOOK_SECRET** (OBRIGATÓRIO para onboarding)
- **O que é:** Secret para validar webhooks do Stripe
- **Onde obter:**
  1. Acesse: https://dashboard.stripe.com/webhooks
  2. Crie um endpoint webhook: `https://seu-dominio.com/api/onboarding/webhooks/stripe`
  3. Copie o "Signing secret" (começa com `whsec_`)
- **Exemplo:** `STRIPE_WEBHOOK_SECRET=whsec_abc123def456...`

---

### **SMTP_USER e SMTP_PASS** (OBRIGATÓRIO para envio de emails)
- **O que é:** Credenciais do servidor SMTP para envio de emails
- **Gmail:**
  1. Ative a verificação em 2 etapas: https://myaccount.google.com/security
  2. Crie uma "App Password": https://myaccount.google.com/apppasswords
  3. Use:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=seu-email@gmail.com
     SMTP_PASS=abcd efgh ijkl mnop  # App Password (16 caracteres com espaços)
     ```

- **SendGrid:**
  ```
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=apikey
  SMTP_PASS=sua-api-key-do-sendgrid
  ```

- **Mailgun:**
  ```
  SMTP_HOST=smtp.mailgun.org
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=seu-usuario@mailgun.org
  SMTP_PASS=sua-senha-do-mailgun
  ```

---

## 🔧 Chaves Opcionais (já têm valores padrão)

### **DATABASE_URL**
- Já configurado para Docker: `postgresql://mecanica365:mecanica365_dev@postgres:5432/mecanica365_db`
- Se usar banco externo, atualize aqui

### **REDIS_HOST e REDIS_PORT**
- Já configurado para Docker: `redis:6379`
- Se usar Redis externo, atualize aqui

### **FRONTEND_URL**
- Padrão: `http://localhost:3000`
- Em produção, use: `https://seu-dominio.com`

---

## ✅ Checklist

Antes de iniciar o backend, verifique:

- [ ] `.env` foi criado a partir de `.env.example`
- [ ] `JWT_SECRET` preenchido (mínimo 32 caracteres)
- [ ] `STRIPE_SECRET_KEY` preenchido (chave de teste ou produção)
- [ ] `STRIPE_WEBHOOK_SECRET` preenchido (se usar onboarding)
- [ ] `SMTP_USER` e `SMTP_PASS` preenchidos (se usar envio de emails)
- [ ] `DATABASE_URL` correto (se não usar Docker)

---

## 🚀 Após Preencher

1. **Reinicie o backend:**
   ```bash
   docker-compose restart backend
   ```

2. **Verifique os logs:**
   ```bash
   docker-compose logs backend --tail 20
   ```

3. **Se tudo estiver OK, você verá:**
   ```
   🚀 Mecânica365 API is running on: http://localhost:3001
   📚 Swagger docs: http://localhost:3001/api/docs
   ```

---

## ⚠️ Segurança

- **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`
- Use chaves diferentes para desenvolvimento e produção
- Rotacione as chaves periodicamente

---

## 📚 Links Úteis

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Gmail App Passwords:** https://myaccount.google.com/apppasswords
- **SendGrid:** https://sendgrid.com
- **Mailgun:** https://www.mailgun.com


