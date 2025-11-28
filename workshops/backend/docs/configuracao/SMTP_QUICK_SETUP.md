# 🚀 Configuração Rápida de SMTP Gratuito

## ⭐ RECOMENDADO: Mailtrap (Para Testes)

**Por quê?** Emails não são enviados de verdade, apenas capturados em um inbox virtual. Perfeito para desenvolvimento!

### Passo a Passo:

1. **Criar conta gratuita:**
   - Acesse: https://mailtrap.io
   - Clique em "Sign Up" (gratuito)
   - Confirme o email

2. **Obter credenciais:**
   - Faça login
   - Vá em "Email Testing" → "Inboxes"
   - Clique no inbox padrão
   - Vá em "SMTP Settings"
   - Selecione "Node.js - Nodemailer"
   - Copie as credenciais

3. **Configurar no `.env`:**
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=seu_username_aqui
   SMTP_PASS=sua_senha_aqui
   ```

4. **Reiniciar:**
   ```bash
   docker-compose restart backend
   ```

5. **Testar:**
   - Faça um novo registro
   - Vá no Mailtrap inbox
   - Veja o email capturado! 📧

---

## 📧 Gmail (Fácil e Rápido)

**Limite:** 500 emails/dia

### Configuração:

1. **Criar Senha de App:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Se não aparecer, ative a verificação em 2 etapas primeiro
   - Selecione "App" → "Mail" → "Outro (nome personalizado)"
   - Digite: "Mecânica365"
   - Copie a senha gerada (16 caracteres)

2. **Configurar no `.env`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seu_email@gmail.com
   SMTP_PASS=senha_de_app_gerada_pelo_google
   ```

3. **Reiniciar:**
   ```bash
   docker-compose restart backend
   ```

---

## 📊 Comparação Rápida

| Serviço | Limite | Tipo | Melhor Para |
|---------|--------|------|-------------|
| **Mailtrap** | 1.000/mês | Sandbox | 🧪 Testes |
| **Gmail** | 500/dia | Real | 🚀 Rápido |
| **Brevo** | 300/dia | Real | 📈 Produção |
| **Mailjet** | 6.000/mês | Real | 📊 Escalável |

---

## ✅ Verificar se Funcionou

Após configurar, verifique os logs:
```bash
docker-compose logs backend | Select-String -Pattern "SMTP|Email"
```

Se aparecer "SMTP connection successful" ou similar, está funcionando! 🎉

