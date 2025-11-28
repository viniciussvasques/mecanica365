# 📧 Configuração SMTP com Mailcow

## 🎯 Informações Necessárias

Para configurar o SMTP com Mailcow, preciso das seguintes informações:

### 1. **SMTP_HOST**
- Hostname ou IP do servidor Mailcow
- Exemplo: `mail.seudominio.com` ou `192.168.1.100`
- Ou o hostname do Mailcow (geralmente `mailcow` se estiver no mesmo servidor)

### 2. **SMTP_PORT**
- Porta SMTP do Mailcow
- Geralmente: `587` (STARTTLS) ou `465` (SSL)
- Ou `25` (sem criptografia, não recomendado)

### 3. **SMTP_USER**
- Email completo criado no Mailcow
- Exemplo: `noreply@seudominio.com` ou `sistema@seudominio.com`
- Deve ser um email válido criado no Mailcow

### 4. **SMTP_PASS**
- Senha do email criado no Mailcow
- A senha que você definiu ao criar o email no Mailcow

### 5. **SMTP_SECURE**
- `false` para porta 587 (STARTTLS)
- `true` para porta 465 (SSL)

---

## 📋 Configuração Padrão do Mailcow

### Porta 587 (STARTTLS) - Recomendado
```env
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua_senha_aqui
```

### Porta 465 (SSL)
```env
SMTP_HOST=mail.seudominio.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua_senha_aqui
```

---

## 🔍 Como Obter as Informações

### 1. Acessar o Mailcow
- Acesse o painel do Mailcow: `https://mail.seudominio.com` (ou seu domínio)
- Faça login com as credenciais de administrador

### 2. Criar um Email (se ainda não tiver)
- Vá em "Email" → "Add Mailbox"
- Crie um email para o sistema (ex: `noreply@seudominio.com`)
- Defina uma senha forte
- Anote o email e senha

### 3. Verificar Configurações SMTP
- No Mailcow, as configurações SMTP geralmente são:
  - **Host:** O domínio do Mailcow (ex: `mail.seudominio.com`)
  - **Porta:** `587` (STARTTLS) ou `465` (SSL)
  - **Autenticação:** Sim (use o email completo e senha)

### 4. Verificar Firewall
- Certifique-se de que a porta 587 ou 465 está aberta no firewall
- Se estiver no mesmo servidor, pode usar `localhost` ou `127.0.0.1`

---

## ⚙️ Configuração no .env

1. **Abra o arquivo `.env`** em `workshops/backend/.env`

2. **Adicione ou atualize as variáveis:**

```env
# SMTP Mailcow
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua_senha_do_email_mailcow
```

3. **Salve o arquivo**

4. **Reinicie o backend:**
```bash
docker-compose restart backend
```

5. **Verifique os logs:**
```bash
docker-compose logs backend | Select-String -Pattern "SMTP|Email"
```

---

## 🔧 Configuração Avançada

### Se o Mailcow estiver no mesmo servidor
Se o Mailcow estiver rodando no mesmo servidor que o backend, você pode usar:

```env
SMTP_HOST=mailcow
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua_senha
```

Ou se estiver em um container Docker na mesma rede:

```env
SMTP_HOST=mailcowdockerized-mailcowdockerized-1
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua_senha
```

### Se precisar de autenticação adicional
Alguns Mailcow podem exigir configurações extras. Nesse caso, podemos ajustar o `email.service.ts`.

---

## ✅ Teste de Conexão

Após configurar, o sistema tentará verificar a conexão automaticamente. Você verá nos logs:

**Sucesso:**
```
[EmailService] SMTP connection verified
```

**Erro:**
```
[EmailService] SMTP connection failed. Emails will not be sent.
```

---

## 🐛 Troubleshooting

### Erro: "Connection timeout"
- Verifique se o `SMTP_HOST` está correto
- Verifique se a porta está aberta no firewall
- Tente usar o IP ao invés do hostname

### Erro: "Authentication failed"
- Verifique se o `SMTP_USER` é o email completo (ex: `noreply@dominio.com`)
- Verifique se a senha está correta
- Verifique se o email existe no Mailcow

### Erro: "Self-signed certificate"
- Se estiver usando SSL (porta 465), pode precisar desabilitar verificação de certificado
- Podemos ajustar isso no código se necessário

### Erro: "Connection refused"
- Verifique se o Mailcow está rodando
- Verifique se a porta está correta (587 ou 465)
- Verifique se o Mailcow aceita conexões externas (se necessário)

---

## 📝 Exemplo Completo

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/mecanica365_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=sua_chave_jwt_aqui
JWT_EXPIRES_IN=1d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP Mailcow
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua_senha_mailcow_aqui

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Próximos Passos

1. **Me forneça as informações:**
   - SMTP_HOST (hostname ou IP)
   - SMTP_PORT (587 ou 465)
   - SMTP_USER (email completo)
   - SMTP_PASS (senha do email)

2. **Eu configuro tudo para você!**

3. **Testamos o envio de email**

---

**Última atualização:** 2024-11-28




