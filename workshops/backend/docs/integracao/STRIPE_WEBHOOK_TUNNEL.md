# 🔧 Configurar Túnel de Webhooks do Stripe

## 📥 Instalação do Stripe CLI

### Windows (PowerShell)

```powershell
# Opção 1: Usando winget (recomendado)
winget install stripe.stripe-cli

# Opção 2: Usando Scoop
scoop install stripe

# Opção 3: Download manual
# Baixe de: https://github.com/stripe/stripe-cli/releases
# Extraia e adicione ao PATH
```

### Verificar Instalação

```powershell
stripe --version
```

---

## 🔑 Autenticação no Stripe

### 1. Login no Stripe

```powershell
stripe login
```

Isso abrirá o navegador para autenticar. Após autenticar, você receberá uma mensagem de sucesso.

### 2. Verificar Autenticação

```powershell
stripe config --list
```

---

## 🌐 Criar Túnel de Webhooks

### Comando Básico

```powershell
stripe listen --forward-to localhost:3001/api/onboarding/webhooks/stripe
```

### Comando com Logs Detalhados

```powershell
stripe listen --forward-to localhost:3001/api/onboarding/webhooks/stripe --print-json
```

### O que acontece:

1. O Stripe CLI cria um túnel público (URL temporária)
2. Todos os webhooks do Stripe são encaminhados para `localhost:3001`
3. Você receberá um **webhook signing secret** (começa com `whsec_...`)
4. **IMPORTANTE**: Copie esse secret e adicione no `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🔄 Processo Completo

### 1. Iniciar o Túnel

```powershell
# Terminal 1: Iniciar túnel
stripe listen --forward-to localhost:3001/api/onboarding/webhooks/stripe
```

**Saída esperada:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### 2. Configurar o Secret no .env

Copie o `whsec_...` e adicione no arquivo `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 3. Reiniciar o Backend (se necessário)

Se o backend já estava rodando, reinicie para carregar a nova variável:

```powershell
# Se estiver usando Docker
docker-compose restart backend

# Se estiver rodando localmente
# Pare e inicie novamente
```

### 4. Testar o Webhook

```powershell
# Em outro terminal, disparar um evento de teste
stripe trigger checkout.session.completed
```

---

## 🧪 Testar Webhook Localmente

### Opção 1: Usar Stripe CLI (Recomendado)

```powershell
# Disparar evento de teste
stripe trigger checkout.session.completed
```

### Opção 2: Criar Checkout Real

1. Crie um checkout através do frontend
2. Complete o pagamento no Stripe (use cartão de teste: `4242 4242 4242 4242`)
3. O webhook será automaticamente encaminhado pelo túnel

---

## 📋 Comandos Úteis

### Ver eventos recebidos

```powershell
stripe listen --forward-to localhost:3001/api/onboarding/webhooks/stripe --print-json
```

### Listar webhooks configurados

```powershell
stripe webhooks list
```

### Ver logs de eventos

```powershell
stripe events list --limit 10
```

### Testar webhook específico

```powershell
# Testar checkout.session.completed
stripe trigger checkout.session.completed

# Testar customer.subscription.created
stripe trigger customer.subscription.created
```

---

## ⚠️ Troubleshooting

### Problema: "stripe: command not found"

**Solução:**
- Verifique se o Stripe CLI está instalado
- Adicione ao PATH do sistema
- Reinicie o terminal

### Problema: "Webhook signature verification failed"

**Solução:**
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto no `.env`
- Certifique-se de usar o secret do túnel atual (muda a cada vez que você inicia o túnel)
- Reinicie o backend após atualizar o `.env`

### Problema: "rawBody não disponível"

**Solução:**
- Verifique se o NestJS está configurado para preservar `rawBody`
- Confira a configuração do `main.ts`:

```typescript
app.use('/api/onboarding/webhooks/stripe', express.raw({ type: 'application/json' }));
```

### Problema: Webhook não chega

**Solução:**
1. Verifique se o túnel está rodando
2. Verifique se a URL está correta: `localhost:3001/api/onboarding/webhooks/stripe`
3. Verifique os logs do túnel: `stripe listen --print-json`
4. Verifique os logs do backend: `docker-compose logs backend --tail 50`

---

## 🚀 Workflow Recomendado

1. **Iniciar túnel** (Terminal 1):
   ```powershell
   stripe listen --forward-to localhost:3001/api/onboarding/webhooks/stripe
   ```

2. **Copiar webhook secret** (aparece na saída do túnel)

3. **Atualizar .env** com o secret

4. **Iniciar backend** (Terminal 2):
   ```powershell
   docker-compose up backend
   ```

5. **Testar** (Terminal 3):
   ```powershell
   stripe trigger checkout.session.completed
   ```

---

## 📚 Referências

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Webhooks Locally](https://stripe.com/docs/stripe-cli/webhooks)



