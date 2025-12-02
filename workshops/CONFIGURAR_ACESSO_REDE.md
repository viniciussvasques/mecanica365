# 🌐 Como Acessar de Outro PC na Rede

Para acessar `http://oficinartee.localhost:3000` de outro PC na mesma rede, você precisa configurar o arquivo `hosts` em cada PC cliente.

## 📋 Passo a Passo

### 1️⃣ Descobrir o IP do Servidor

No PC que está rodando o sistema, abra PowerShell e execute:

```powershell
ipconfig | Select-String -Pattern "IPv4"
```

Anote o IP (exemplo: `192.168.1.60`)

### 2️⃣ Configurar arquivo hosts no PC Cliente

**Windows:**

1. Abra o **Notepad como Administrador**:
   - Clique com botão direito no Notepad
   - Selecione "Executar como administrador"

2. Abra o arquivo hosts:
   - Vá em: `Arquivo` → `Abrir`
   - Navegue até: `C:\Windows\System32\drivers\etc\`
   - Mude o filtro de "Documentos de Texto (*.txt)" para **"Todos os Arquivos (*.*)"**
   - Selecione o arquivo `hosts` (sem extensão)

3. Adicione esta linha no final do arquivo (substitua `192.168.1.60` pelo IP do servidor):

```
192.168.1.60    oficinartee.localhost
```

4. Salve o arquivo (Ctrl+S)

**Linux/Mac:**

```bash
sudo nano /etc/hosts
```

Adicione a mesma linha e salve (Ctrl+X, depois Y, depois Enter)

### 3️⃣ Verificar se o Frontend está aceitando conexões externas

No PC servidor, certifique-se de que o frontend está rodando com:

```bash
cd workshops/frontend
npm run dev
```

O comando `dev` já está configurado para aceitar conexões de `0.0.0.0` (todos os IPs).

### 4️⃣ Acessar do PC Cliente

No navegador do PC cliente, acesse:

```
http://oficinartee.localhost:3000
```

## ✅ Teste Rápido

No PC cliente, abra PowerShell e teste:

```powershell
ping oficinartee.localhost
```

Deve retornar o IP do servidor (ex: `192.168.1.60`)

## 🔥 Configurar Firewall (se necessário)

Se não conseguir acessar, pode ser o firewall bloqueando:

1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações Avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → Próximo
5. Selecione "TCP" e digite: `3000`
6. Permita a conexão
7. Aplique para todos os perfis
8. Dê um nome: "Mecânica365 Frontend"

## 🚨 Solução de Problemas

### "Não consegue acessar"
- Verifique se o IP está correto no arquivo hosts
- Verifique se o frontend está rodando no servidor
- Verifique se o firewall permite a porta 3000

### "Página não carrega"
- Verifique se o Next.js está rodando com `-H 0.0.0.0`
- Teste acessar pelo IP direto: `http://192.168.1.60:3000`

### "Subdomain não funciona"
- Certifique-se de que o subdomain está salvo no localStorage após login
- O sistema usa o header `X-Tenant-Subdomain` automaticamente

## 📝 Nota Importante

O arquivo `hosts` precisa ser configurado em **cada PC** que vai acessar o sistema. Se você tiver 5 PCs, precisa configurar o hosts em cada um deles.

## 🔄 Alternativa: Script Automatizado

Crie um arquivo `configurar-hosts.bat` no PC cliente:

```batch
@echo off
echo Adicionando oficinartee.localhost ao arquivo hosts...
echo 192.168.1.60    oficinartee.localhost >> C:\Windows\System32\drivers\etc\hosts
echo.
echo Configuracao concluida!
echo Agora voce pode acessar: http://oficinartee.localhost:3000
pause
```

Execute como Administrador.

