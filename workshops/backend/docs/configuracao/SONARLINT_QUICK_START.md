# ⚡ SonarLint - Guia Rápido de Instalação

## 🎯 Objetivo

Configurar o SonarLint no VS Code para correção automática de código em 5 minutos.

## 📋 Pré-requisitos

- ✅ VS Code instalado
- ✅ SonarQube rodando em `http://localhost:9000`
- ✅ Token do SonarQube (gerado em My Account → Security → Generate Tokens)

## 🚀 Passo a Passo

### ⚡ Método Rápido: Script Automático (Recomendado)

Execute o script de configuração automática:

```powershell
# No PowerShell, na pasta workshops/backend
.\scripts\configure-sonarlint.ps1
```

O script irá:
- ✅ Verificar se o VS Code está instalado
- ✅ Instalar a extensão SonarLint (se não estiver instalada)
- ✅ Configurar conexão com SonarQube
- ✅ Criar binding do projeto

**Você só precisa fornecer o token do SonarQube quando solicitado!**

---

### 📝 Método Manual: Passo a Passo

### 1️⃣ Instalar Extensão SonarLint

**Opção A: Via VS Code (Recomendado)**

1. Abra o VS Code na pasta `workshops/backend`
2. Se aparecer notificação de extensões recomendadas, clique em **"Install All"**
3. Se não aparecer, pressione **Ctrl+Shift+X** e procure por **"SonarLint"**
4. Instale a extensão da **SonarSource**

**Opção B: Via Terminal**

```powershell
# No PowerShell
code --install-extension SonarSource.sonarlint-vscode
```

**Opção C: Via Marketplace**

Acesse: https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode

### 2️⃣ Verificar Instalação

1. Pressione **Ctrl+Shift+P** (ou **Cmd+Shift+P**)
2. Digite: `SonarLint`
3. Se aparecer comandos do SonarLint, a instalação foi bem-sucedida ✅

### 3️⃣ Conectar ao SonarQube

1. Pressione **Ctrl+Shift+P**
2. Digite: `SonarLint: Add SonarQube Connection`
3. Preencha:
   - **Connection Name:** `Local SonarQube`
   - **Server URL:** `http://localhost:9000`
   - **Token:** Cole seu token do SonarQube
4. Pressione Enter

### 4️⃣ Conectar Projeto

1. Pressione **Ctrl+Shift+P**
2. Digite: `SonarLint: Update All Project Bindings`
3. Selecione a conexão: `Local SonarQube`
4. Selecione o projeto: `mecanica365-workshops-backend`
5. Pressione Enter

### 5️⃣ Verificar Configuração

1. Abra qualquer arquivo `.ts` do projeto
2. Se houver problemas, você verá sublinhados coloridos
3. Pressione **Ctrl + .** (ou **Cmd + .**) em uma linha com problema
4. Se aparecer **"SonarLint: Fix this issue"**, está funcionando! ✅

## ✅ Teste Rápido

1. Abra o arquivo: `src/app/app.service.ts`
2. Adicione uma linha: `const unused = 'test';`
3. Salve o arquivo (Ctrl+S)
4. Você deve ver um aviso do SonarLint
5. Pressione **Ctrl + .** na linha
6. Selecione **"SonarLint: Remove unused variable"**
7. A variável será removida automaticamente! 🎉

## 🔧 Configurações Já Aplicadas

O projeto já tem as seguintes configurações em `.vscode/settings.json`:

- ✅ SonarLint habilitado
- ✅ Autofix habilitado
- ✅ Quick Fix habilitado
- ✅ Correção automática ao salvar

**Não precisa configurar nada manualmente!**

## 🆘 Problemas Comuns

### Extensão não aparece

1. Verifique se está procurando por **"SonarLint"** (com L maiúsculo)
2. Certifique-se de que está instalando da **SonarSource**
3. Tente reiniciar o VS Code

### Não conecta ao SonarQube

1. Verifique se o SonarQube está rodando:
   ```powershell
   docker-compose ps sonarqube
   ```
2. Verifique a URL: `http://localhost:9000`
3. Teste no navegador se acessa o SonarQube
4. Verifique se o token está correto

### Quick Fix não funciona

1. Verifique se o arquivo está salvo
2. Verifique se há problemas detectados (painel Problems)
3. Tente recarregar a janela: **Ctrl+Shift+P** → `Developer: Reload Window`

## 🎯 Configuração Automática via Script

Se preferir, use o script PowerShell para configurar tudo automaticamente:

```powershell
# Execute na pasta workshops/backend
.\scripts\configure-sonarlint.ps1
```

**Parâmetros opcionais:**
```powershell
.\scripts\configure-sonarlint.ps1 `
    -SonarQubeUrl "http://localhost:9000" `
    -Token "seu-token-aqui" `
    -ConnectionName "Local SonarQube" `
    -ProjectKey "mecanica365-workshops-backend"
```

## 📚 Próximos Passos

- Leia o [Guia Completo](./SONARLINT_SETUP.md) para mais detalhes
- Configure atalhos personalizados se necessário
- Explore outras correções automáticas disponíveis

---

**Última atualização:** 02/12/2025

