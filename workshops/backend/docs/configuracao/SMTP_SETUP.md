# 📧 Configuração de SMTP Gratuito para Testes

## Opções de SMTP Gratuito

### 1. **Mailtrap (Recomendado para Testes)**
- **Limite**: 1.000 emails/mês
- **Vantagem**: Ambiente sandbox - emails não são enviados de verdade, apenas capturados para teste
- **Ideal para**: Desenvolvimento e testes
- **Site**: https://mailtrap.io

**Configuração:**
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=seu_username_mailtrap
SMTP_PASS=sua_senha_mailtrap
```

### 2. **Gmail (Fácil e Gratuito)**
- **Limite**: 500 emails/dia
- **Vantagem**: Muito fácil de configurar
- **Requisito**: Precisa criar "Senha de App" no Google
- **Site**: https://myaccount.google.com/apppasswords

**Configuração:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app_google
```

**Como criar Senha de App no Gmail:**
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "App" → "Mail" → "Outro (nome personalizado)"
3. Digite "Mecânica365"
4. Copie a senha gerada (16 caracteres)
5. Use essa senha no `SMTP_PASS`

### 3. **Brevo (Sendinblue) - Melhor para Produção**
- **Limite**: 300 emails/dia
- **Vantagem**: Serviço profissional, boa entregabilidade
- **Site**: https://www.brevo.com

**Configuração:**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=seu_email@brevo.com
SMTP_PASS=sua_senha_brevo
```

### 4. **Mailjet**
- **Limite**: 6.000 emails/mês (200/dia)
- **Vantagem**: Boa para testes e produção
- **Site**: https://www.mailjet.com

**Configuração:**
```env
SMTP_HOST=in-v3.mailjet.com
SMTP_PORT=587
SMTP_USER=seu_api_key
SMTP_PASS=sua_secret_key
```

### 5. **SMTP2GO**
- **Limite**: 1.000 emails/mês
- **Vantagem**: Simples e direto
- **Site**: https://www.smtp2go.com

**Configuração:**
```env
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=seu_username
SMTP_PASS=sua_senha
```

## 🚀 Configuração Rápida (Recomendado: Mailtrap)

### Passo 1: Criar conta no Mailtrap
1. Acesse: https://mailtrap.io
2. Crie uma conta gratuita
3. Vá em "Email Testing" → "Inboxes"
4. Selecione "SMTP Settings"
5. Escolha "Node.js - Nodemailer"
6. Copie as credenciais

### Passo 2: Configurar no .env
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=seu_username_aqui
SMTP_PASS=sua_senha_aqui
```

### Passo 3: Reiniciar o backend
```bash
docker-compose restart backend
```

## ✅ Verificar se está funcionando

Após configurar, teste fazendo um novo registro. O email aparecerá no Mailtrap inbox (não será enviado de verdade, apenas capturado para visualização).

## 📝 Nota Importante

- **Mailtrap**: Emails não são enviados, apenas capturados (ideal para testes)
- **Gmail/Brevo/Mailjet**: Emails são enviados de verdade
- Para produção, recomenda-se **Brevo** ou **Mailjet**

