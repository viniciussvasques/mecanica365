# 🔍 Como Ver Configurações SMTP no Mailcow

## 📋 Configurações Atuais no Sistema

### No arquivo `.env`:
```env
SMTP_HOST=mail.innexar.app
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@mecanica365.com
SMTP_PASS=Dhv@787475
```

### Verificar no Container:
```bash
docker-compose exec backend printenv | Select-String -Pattern "SMTP"
```

### Verificar Status da Conexão:
```bash
docker-compose logs backend | Select-String -Pattern "SMTP|Email|connection|verified"
```

---

## 🌐 Acessar Painel do Mailcow

### 1. **Acesse o Painel Web do Mailcow**
- URL: `https://mail.innexar.app` (ou seu domínio Mailcow)
- Faça login com as credenciais de administrador

### 2. **Verificar Configurações SMTP**

#### Opção A: Via Interface Web
1. No painel do Mailcow, vá em **"Configuration"** ou **"Settings"**
2. Procure por **"SMTP Settings"** ou **"Mail Settings"**
3. Você verá:
   - Host SMTP
   - Porta SMTP
   - Autenticação
   - TLS/SSL

#### Opção B: Verificar Mailbox
1. Vá em **"Email"** → **"Mailboxes"**
2. Clique no email `no-reply@mecanica365.com`
3. Você verá:
   - Email completo
   - Status (ativo/inativo)
   - Quota
   - Configurações de acesso

### 3. **Verificar Logs do Mailcow**
1. No painel, vá em **"Logs"** ou **"System Logs"**
2. Procure por tentativas de conexão SMTP
3. Verifique se há erros de autenticação

---

## 🔧 Verificar Configurações via Terminal (se tiver acesso SSH)

### Se o Mailcow estiver no mesmo servidor:

```bash
# Verificar configurações do Postfix (SMTP do Mailcow)
docker exec mailcowdockerized-postfix-mailcow-1 postconf | grep smtpd

# Verificar logs do Postfix
docker logs mailcowdockerized-postfix-mailcow-1 --tail 50

# Verificar se o email existe
docker exec mailcowdockerized-dovecot-mailcow-1 doveadm user no-reply@mecanica365.com
```

---

## 📊 Testar Conexão SMTP Manualmente

### Via Telnet (se disponível):
```bash
telnet mail.innexar.app 587
```

### Via PowerShell (Windows):
```powershell
Test-NetConnection -ComputerName mail.innexar.app -Port 587
```

### Via Docker (no container do backend):
```bash
docker-compose exec backend sh -c "nc -zv mail.innexar.app 587"
```

---

## ✅ Verificar se Está Funcionando

### 1. **Verificar Logs do Backend:**
```bash
docker-compose logs backend | Select-String -Pattern "SMTP|Email"
```

**Sucesso:**
```
[EmailService] ✅ SMTP connection verified successfully
```

**Erro:**
```
[EmailService] ❌ SMTP connection failed
[EmailService] Error: ...
```

### 2. **Testar Envio de Email:**
- Faça um novo registro no sistema
- Verifique se o email de boas-vindas foi enviado
- Verifique a caixa de entrada do `no-reply@mecanica365.com` no Mailcow

### 3. **Verificar Logs do Mailcow:**
- No painel do Mailcow, vá em **"Logs"**
- Procure por tentativas de envio do email `no-reply@mecanica365.com`

---

## 🔐 Informações Importantes

### Credenciais Configuradas:
- **Host:** `mail.innexar.app`
- **Porta:** `587` (STARTTLS)
- **Email:** `no-reply@mecanica365.com`
- **Senha:** `Dhv@787475`
- **Seguro:** `false` (usa STARTTLS na porta 587)
- **Certificado:** Autoassinado (aceito)

### Status Atual:
✅ **Conexão SMTP verificada com sucesso!**

---

## 🐛 Troubleshooting

### Se a conexão falhar:

1. **Verificar se o email existe no Mailcow:**
   - Acesse o painel do Mailcow
   - Vá em "Email" → "Mailboxes"
   - Verifique se `no-reply@mecanica365.com` existe

2. **Verificar se a senha está correta:**
   - Tente fazer login no webmail do Mailcow com essas credenciais
   - URL: `https://mail.innexar.app` → Webmail

3. **Verificar firewall:**
   - Certifique-se de que a porta 587 está aberta
   - Verifique se o Mailcow aceita conexões externas

4. **Verificar logs do Mailcow:**
   - No painel, vá em "Logs"
   - Procure por erros relacionados ao SMTP

---

## 📝 Comandos Úteis

### Ver configurações no .env:
```powershell
Get-Content .env | Select-String -Pattern "SMTP"
```

### Ver variáveis no container:
```bash
docker-compose exec backend printenv | Select-String -Pattern "SMTP"
```

### Ver logs do backend:
```bash
docker-compose logs backend --tail 50 | Select-String -Pattern "SMTP|Email"
```

### Reiniciar backend:
```bash
docker-compose restart backend
```

---

**Última atualização:** 2024-11-28




