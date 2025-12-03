# 🔧 SonarLint - Configuração e Uso

## 📋 Visão Geral

O SonarLint é uma extensão do VS Code que analisa o código em tempo real e oferece sugestões de correção automática, integrando-se com o SonarQube para manter a qualidade do código.

## 🚀 Instalação

### Método 1: Instalação Automática (Recomendado)

O projeto já tem um arquivo `.vscode/extensions.json` que recomenda as extensões necessárias.

1. **Abra o VS Code** na pasta do projeto: `workshops/backend`
2. O VS Code mostrará uma notificação: **"This workspace has extension recommendations"**
3. Clique em **"Install All"** ou **"Show Recommendations"**
4. Instale a extensão **"SonarLint"** da lista

### Método 2: Instalação Manual

#### Opção A: Via Marketplace

1. Abra o VS Code
2. Pressione **Ctrl+Shift+X** (Windows/Linux) ou **Cmd+Shift+X** (Mac)
3. Na barra de pesquisa, digite: `SonarLint`
4. Procure pela extensão: **"SonarLint"** da **SonarSource**
5. Clique em **"Install"**

#### Opção B: Via ID da Extensão

1. Pressione **Ctrl+Shift+P** (ou **Cmd+Shift+P**)
2. Digite: `Extensions: Install Extensions`
3. Cole o ID: `SonarSource.sonarlint-vscode`
4. Pressione Enter

#### Opção C: Via Link Direto

Acesse diretamente:
```
https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode
```

Ou use o comando no terminal:
```bash
code --install-extension SonarSource.sonarlint-vscode
```

### 2. Conectar ao SonarQube

1. Abra o VS Code
2. Pressione **Ctrl+Shift+P** (Windows/Linux) ou **Cmd+Shift+P** (Mac)
3. Digite: `SonarLint: Add SonarQube Connection`
4. Preencha:
   - **Connection Name:** `Local SonarQube` (ou qualquer nome)
   - **Server URL:** `http://localhost:9000`
   - **Token:** Cole o token do SonarQube (gerado em My Account → Security → Generate Tokens)

### 3. Conectar Projeto ao SonarQube

1. Pressione **Ctrl+Shift+P** (ou **Cmd+Shift+P**)
2. Digite: `SonarLint: Update All Project Bindings`
3. Selecione a conexão criada
4. Selecione o projeto: `mecanica365-workshops-backend`

## ⚙️ Configuração de Autofix / Quick Fix

### Habilitar Autofix

1. Abra as configurações do VS Code:
   - **Ctrl+,** (Windows/Linux) ou **Cmd+,** (Mac)
   - Ou: **File** → **Preferences** → **Settings**

2. Procure por: `sonarlint`

3. Marque as opções:
   - ✅ **SonarLint: Enable Autofix**
   - ✅ **SonarLint: Enable Quick Fix**

### Configurações Recomendadas

Adicione ao `.vscode/settings.json`:

```json
{
  "sonarlint.enable": true,
  "sonarlint.enableAutofix": true,
  "sonarlint.enableQuickFix": true,
  "sonarlint.rules": {
    "typescript:S1874": "on",
    "typescript:S1854": "on",
    "typescript:S4165": "on",
    "typescript:S7742": "on"
  }
}
```

## 🔨 Como Usar Quick Fix

### Método 1: Atalho de Teclado

1. **Posicione o cursor** na linha com o problema (indicado por sublinhado)
2. Pressione:
   - **Ctrl + .** (Windows/Linux)
   - **Cmd + .** (Mac)
3. Selecione **"SonarLint: Fix this issue"** ou **"Quick Fix"**

### Método 2: Menu de Contexto

1. **Clique com botão direito** na linha com problema
2. Selecione **"Quick Fix"** ou **"SonarLint: Fix this issue"**

### Método 3: Problemas Panel

1. Abra o painel **Problems** (Ctrl+Shift+M ou Cmd+Shift+M)
2. Clique no problema do SonarLint
3. Clique no ícone de **lâmpada** 💡 ao lado do problema
4. Selecione a correção sugerida

## 📊 Tipos de Correções Automáticas

O SonarLint pode corrigir automaticamente:

### ✅ Correções Disponíveis

- **Imports não utilizados** - Remove imports desnecessários
- **Variáveis não utilizadas** - Remove ou renomeia variáveis
- **Uso de `any`** - Converte para `unknown` ou tipo específico
- **`parseInt`** - Converte para `Number.parseInt`
- **Condições negadas** - Simplifica lógica booleana
- **Operadores ternários** - Converte para nullish coalescing (`??`)
- **Formatação** - Corrige indentação e espaçamento
- **Nomenclatura** - Sugere nomes mais descritivos

### ⚠️ Correções que Requerem Revisão

- **Refatoração de complexidade** - Pode alterar estrutura do código
- **Extração de métodos** - Cria novos métodos
- **Reorganização de código** - Move blocos de código

## 🎯 Exemplos Práticos

### Exemplo 1: Remover Import Não Utilizado

**Antes:**
```typescript
import { ConflictException, BadRequestException, Logger } from '@nestjs/common';
// ConflictException nunca é usado
```

**Após Quick Fix:**
```typescript
import { BadRequestException, Logger } from '@nestjs/common';
```

### Exemplo 2: Converter `parseInt` para `Number.parseInt`

**Antes:**
```typescript
const value = parseInt(str, 10);
```

**Após Quick Fix:**
```typescript
const value = Number.parseInt(str, 10);
```

### Exemplo 3: Converter `any` para `unknown`

**Antes:**
```typescript
catch (error: any) {
  console.log(error.message);
}
```

**Após Quick Fix:**
```typescript
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  }
}
```

### Exemplo 4: Simplificar Condição Negada

**Antes:**
```typescript
if (!value) {
  return defaultValue;
}
```

**Após Quick Fix:**
```typescript
return value ?? defaultValue;
```

## 🔍 Verificar Problemas

### Painel de Problemas

1. Abra o painel **Problems**:
   - **Ctrl+Shift+M** (Windows/Linux)
   - **Cmd+Shift+M** (Mac)

2. Filtre por **SonarLint**:
   - Clique no ícone de filtro
   - Selecione **"SonarLint"**

### Indicadores Visuais

- **Sublinhado vermelho** - Problema crítico (Blocker/Critical)
- **Sublinhado laranja** - Problema importante (Major)
- **Sublinhado amarelo** - Problema menor (Minor/Info)
- **Ícone de lâmpada** 💡 - Correção automática disponível

## ⚡ Atalhos Úteis

| Ação | Windows/Linux | Mac |
|------|---------------|-----|
| Quick Fix | `Ctrl + .` | `Cmd + .` |
| Abrir Problemas | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Settings | `Ctrl+,` | `Cmd+,` |

## 🔄 Sincronização com SonarQube

O SonarLint sincroniza automaticamente:

- ✅ **Regras ativas** do projeto SonarQube
- ✅ **Quality Profiles** configurados
- ✅ **Exclusões** de arquivos
- ✅ **Configurações** do projeto

### Atualizar Regras

1. Pressione **Ctrl+Shift+P** (ou **Cmd+Shift+P**)
2. Digite: `SonarLint: Update All Project Bindings`
3. Selecione a conexão e projeto

## 🐛 Troubleshooting

### SonarLint não mostra problemas

1. Verifique se a extensão está instalada e habilitada
2. Verifique se está conectado ao SonarQube
3. Recarregue a janela: **Ctrl+Shift+P** → `Developer: Reload Window`

### Quick Fix não aparece

1. Verifique se **Autofix** está habilitado nas configurações
2. Alguns problemas não têm correção automática disponível
3. Verifique se o arquivo está salvo

### Conexão com SonarQube falha

1. Verifique se o SonarQube está rodando: `docker-compose ps sonarqube`
2. Verifique a URL: `http://localhost:9000`
3. Verifique se o token está correto
4. Teste a conexão: **Ctrl+Shift+P** → `SonarLint: Test Connection`

## 📚 Referências

- [Documentação SonarLint](https://www.sonarlint.org/)
- [SonarLint VS Code Extension](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)
- [SonarQube Rules](https://rules.sonarsource.com/)

## 💡 Dicas

1. **Use Quick Fix regularmente** - Corrija problemas enquanto escreve o código
2. **Revise correções automáticas** - Nem todas as sugestões são adequadas
3. **Configure regras personalizadas** - Ajuste regras conforme necessário
4. **Sincronize com SonarQube** - Mantenha regras alinhadas com o servidor

---

**Última atualização:** 02/12/2025

