# GitHub Actions - CI/CD

Este diretório contém os workflows de CI/CD do projeto.

## 📋 Workflows Disponíveis

### 1. CI (`ci.yml`)

Executa validações básicas em cada push e pull request:

- ✅ Lint (ESLint)
- ✅ Build (TypeScript compilation)
- ✅ Testes unitários
- ✅ Testes E2E

**Triggers:**
- Push para `main`, `develop`, `release/**`
- Pull requests para `main`, `develop`, `release/**`
- Execução manual via GitHub UI

### 2. SonarQube Analysis (`sonarqube.yml`)

Executa análise completa de qualidade de código:

- ✅ Lint
- ✅ Build
- ✅ Testes com cobertura
- ✅ Análise SonarQube
- ✅ Verificação de Quality Gate
- ❌ **Bloqueia merge se Quality Gate falhar**

**Triggers:**
- Push para `main`, `develop`, `release/**`
- Pull requests para `main`, `develop`, `release/**`
- Execução manual via GitHub UI

## 🔐 Configuração de Secrets

Para que o workflow SonarQube funcione, configure os seguintes secrets:

### 1. Acessar Secrets

1. Vá para o repositório no GitHub
2. Clique em **Settings**
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### 2. Secrets Necessários

#### `SONAR_TOKEN`

Token de autenticação do SonarQube.

**Como gerar:**
1. Acesse o SonarQube: http://localhost:9000 (ou URL do servidor)
2. Faça login
3. Vá em: **My Account** → **Security** → **Generate Tokens**
4. Dê um nome (ex: `github-actions`)
5. **COPIE O TOKEN** (você não verá novamente!)
6. Cole no secret `SONAR_TOKEN`

#### `SONAR_HOST_URL`

URL do servidor SonarQube.

**Exemplos:**
- Local: `http://localhost:9000`
- Produção: `https://sonarqube.example.com`
- Cloud: `https://sonarcloud.io` (se usar SonarCloud)

⚠️ **IMPORTANTE:** Se usar SonarCloud, você também precisará configurar a organização e o projeto.

## 🚀 Executar Workflows Manualmente

1. Vá para a aba **Actions** no GitHub
2. Selecione o workflow desejado (CI ou SonarQube Analysis)
3. Clique em **Run workflow**
4. Selecione a branch
5. Clique em **Run workflow**

## 📊 Ver Resultados

### CI Workflow

- ✅ Verde: Todos os testes passaram
- ❌ Vermelho: Algum teste falhou (veja os logs)

### SonarQube Workflow

- ✅ Verde: Quality Gate passou
- ❌ Vermelho: Quality Gate falhou (veja os logs e o dashboard SonarQube)

**Visualizar no SonarQube:**
1. Acesse o SonarQube
2. Vá em **Projects**
3. Clique no projeto `mecanica365-workshops-backend`
4. Veja métricas, bugs, vulnerabilidades, code smells, etc.

## 🔧 Troubleshooting

### Workflow falha com "SONAR_TOKEN not found"

- Verifique se o secret `SONAR_TOKEN` está configurado
- Verifique se o nome do secret está correto (case-sensitive)

### Workflow falha com "Connection refused"

- Verifique se o `SONAR_HOST_URL` está correto
- Verifique se o servidor SonarQube está acessível
- Se usar localhost, configure um túnel ou use um servidor público

### Quality Gate falha

- Acesse o SonarQube e veja os detalhes
- Corrija os problemas reportados
- Execute o workflow novamente

## 📚 Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SonarQube Scanner for GitHub Actions](https://github.com/sonarsource/sonarqube-scan-action)
- [SonarQube Quality Gate Action](https://github.com/sonarsource/sonarqube-quality-gate-action)

---

**Última atualização:** 02/12/2025


