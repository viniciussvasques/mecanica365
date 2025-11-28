# 🛡️ Como Evitar que Emails Vão para Spam - Mailcow

## 🎯 Problema
Emails enviados pelo Mailcow estão indo para a pasta de spam. Isso acontece porque o Gmail e outros provedores verificam a autenticidade do email através de registros DNS.

## ✅ Solução: Configurar SPF, DKIM e DMARC

### 1. **SPF (Sender Policy Framework)**
Define quais servidores podem enviar emails em nome do seu domínio.

### 2. **DKIM (DomainKeys Identified Mail)**
Assina digitalmente os emails para provar autenticidade.

### 3. **DMARC (Domain-based Message Authentication)**
Política que define o que fazer com emails que falham na verificação.

---

## 📋 Passo a Passo

### 1. Acessar o Painel do Mailcow

1. Acesse: `https://mail.innexar.app`
2. Faça login com credenciais de administrador
3. Vá em **"Configuration"** ou **"DNS"**

### 2. Obter Registros DNS

No painel do Mailcow, você encontrará:

#### **SPF Record:**
```
v=spf1 mx a ip4:SEU_IP_DO_SERVIDOR ~all
```

#### **DKIM Record:**
O Mailcow gera automaticamente. Você encontrará algo como:
```
mail._domainkey.mecanica365.com TXT "v=DKIM1; k=rsa; p=CHAVE_PUBLICA_AQUI"
```

#### **DMARC Record:**
```
_dmarc.mecanica365.com TXT "v=DMARC1; p=quarantine; rua=mailto:postmaster@mecanica365.com"
```

---

## 🔧 Configuração no DNS

### No seu provedor de DNS (onde está o domínio `mecanica365.com`):

#### 1. **Adicionar SPF**
```
Tipo: TXT
Nome: @ (ou mecanica365.com)
Valor: v=spf1 mx a ip4:IP_DO_SEU_SERVIDOR_MAILCOW ~all
TTL: 3600
```

**Exemplo:**
```
Tipo: TXT
Nome: @
Valor: v=spf1 mx a ip4:192.168.1.100 ~all
```

#### 2. **Adicionar DKIM**
O Mailcow gera isso automaticamente. No painel, copie o registro completo:

```
Tipo: TXT
Nome: mail._domainkey (ou mail._domainkey.mecanica365.com)
Valor: v=DKIM1; k=rsa; p=CHAVE_PUBLICA_LONGA_AQUI
TTL: 3600
```

#### 3. **Adicionar DMARC**
```
Tipo: TXT
Nome: _dmarc (ou _dmarc.mecanica365.com)
Valor: v=DMARC1; p=quarantine; rua=mailto:postmaster@mecanica365.com
TTL: 3600
```

#### 4. **Verificar MX Records**
Certifique-se de que os registros MX estão corretos:

```
Tipo: MX
Nome: @
Prioridade: 10
Valor: mail.innexar.app (ou seu hostname do Mailcow)
```

---

## 🔍 Como Verificar no Mailcow

### 1. **No Painel do Mailcow:**
- Vá em **"Configuration"** → **"DNS"**
- Você verá todos os registros necessários
- Copie cada um e adicione no seu DNS

### 2. **Verificar se está funcionando:**

#### Teste SPF:
```bash
nslookup -type=TXT mecanica365.com
```
Deve retornar o registro SPF.

#### Teste DKIM:
```bash
nslookup -type=TXT mail._domainkey.mecanica365.com
```
Deve retornar a chave DKIM.

#### Teste DMARC:
```bash
nslookup -type=TXT _dmarc.mecanica365.com
```
Deve retornar a política DMARC.

---

## 🌐 Ferramentas Online para Testar

### 1. **MXToolbox**
- Acesse: https://mxtoolbox.com/spf.aspx
- Digite seu domínio: `mecanica365.com`
- Verifique se SPF, DKIM e DMARC estão configurados

### 2. **Mail-Tester**
- Acesse: https://www.mail-tester.com
- Envie um email para o endereço fornecido
- Veja a pontuação (deve ser 10/10)

### 3. **Google Postmaster Tools**
- Acesse: https://postmaster.google.com
- Adicione seu domínio
- Verifique a reputação do domínio

---

## ⚙️ Configurações Adicionais no Mailcow

### 1. **Reverse DNS (rDNS)**
Configure o PTR record no seu provedor de hospedagem:
- O IP do servidor Mailcow deve apontar para: `mail.innexar.app` (ou seu hostname)

### 2. **Hostname do Servidor**
Certifique-se de que o hostname do servidor está correto:
```bash
hostname
# Deve retornar: mail.innexar.app (ou similar)
```

### 3. **Banner SMTP**
No Mailcow, configure um banner SMTP apropriado.

---

## 📧 Melhorar o Conteúdo do Email

### 1. **Assunto e Conteúdo**
- Evite palavras como "GRÁTIS", "OFERTA", "CLIQUE AQUI"
- Use texto normal, não apenas HTML
- Inclua versão texto do email

### 2. **Remetente**
- Use um email válido: `no-reply@mecanica365.com`
- Configure "Reply-To" se necessário

### 3. **Links**
- Use links do seu próprio domínio
- Evite encurtadores de URL
- Certifique-se de que os links são HTTPS

---

## 🔧 Ajustar Código do EmailService

Vou melhorar o template do email para incluir versão texto e melhorar a estrutura:

```typescript
// Já está implementado, mas podemos melhorar
```

---

## ✅ Checklist Completo

- [ ] SPF configurado no DNS
- [ ] DKIM configurado no DNS
- [ ] DMARC configurado no DNS
- [ ] MX records corretos
- [ ] Reverse DNS (PTR) configurado
- [ ] Hostname do servidor correto
- [ ] Testado com Mail-Tester (10/10)
- [ ] Verificado com MXToolbox
- [ ] Google Postmaster Tools configurado

---

## 🚀 Após Configurar

1. **Aguarde propagação DNS** (pode levar até 48 horas, geralmente 1-2 horas)
2. **Teste novamente** enviando um email
3. **Verifique** se ainda vai para spam
4. **Se ainda for para spam**, aguarde alguns dias para o Gmail "aprender" que seu domínio é confiável

---

## 📝 Comandos Úteis para Verificar

### Verificar SPF:
```powershell
nslookup -type=TXT mecanica365.com
```

### Verificar DKIM:
```powershell
nslookup -type=TXT mail._domainkey.mecanica365.com
```

### Verificar DMARC:
```powershell
nslookup -type=TXT _dmarc.mecanica365.com
```

### Verificar MX:
```powershell
nslookup -type=MX mecanica365.com
```

---

## 🎯 Resultado Esperado

Após configurar tudo corretamente:
- ✅ Emails não vão mais para spam
- ✅ Pontuação 10/10 no Mail-Tester
- ✅ Todos os checks passam no MXToolbox
- ✅ Gmail confia no seu domínio

---

## 📞 Próximos Passos

1. **Acesse o painel do Mailcow** e copie os registros DNS
2. **Adicione no seu provedor de DNS** (onde está o domínio)
3. **Aguarde propagação** (1-2 horas)
4. **Teste novamente** enviando um email
5. **Verifique** se ainda vai para spam

---

**Última atualização:** 2024-11-28  
**Importante:** A propagação DNS pode levar até 48 horas, mas geralmente é mais rápida (1-2 horas).




