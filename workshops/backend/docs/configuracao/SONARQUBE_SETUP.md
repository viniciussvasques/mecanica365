# 🔍 SonarQube - Configuração e Uso

## 📋 Visão Geral

O SonarQube está integrado ao projeto para análise contínua de qualidade de código, cobertura de testes, bugs, vulnerabilidades e code smells.

## 🚀 Setup Inicial

### 1. Subir o SonarQube

O SonarQube já está configurado no `docker-compose.yml`. Para iniciar:

```bash
docker-compose up -d sonarqube sonarqube_db
```

Aguarde alguns minutos para o SonarQube inicializar completamente.

### 2. Acessar o SonarQube

Abra no navegador:
```
http://localhost:9000
```

**Login padrão:**
- Usuário: `admin`
- Senha: `admin`

⚠️ **IMPORTANTE:** Na primeira vez, você será solicitado a alterar a senha.

### 3. Criar Projeto no SonarQube

1. Após fazer login, clique em **"Create Project"**
2. Escolha **"Manually"**
3. Preencha:
   - **Project display name:** `Mecânica365 Workshops Backend`
   - **Project key:** `mecanica365-workshops-backend`
4. Clique em **"Set Up"**
5. Escolha **"Locally"** (análise local)
6. Escolha **"Generate a token"**
7. Dê um nome ao token (ex: `local-analysis`)
8. **COPIE O TOKEN GERADO** (você não verá novamente!)

### 4. Configurar Token no Projeto

Edite o arquivo `sonar-project.properties` e adicione o token:

```properties
sonar.login=SEU_TOKEN_AQUI
```

Ou use variável de ambiente:

```bash
# Windows PowerShell
$env:SONAR_TOKEN="seu-token-aqui"

# Linux/Mac
export SONAR_TOKEN="seu-token-aqui"
```

E no `sonar-project.properties`:
```properties
sonar.login=${SONAR_TOKEN}
```

## 📊 Executar Análise

### Análise Completa (com cobertura)

```bash
npm run sonar:local
```

Este comando:
1. Executa os testes com cobertura
2. Gera relatório LCOV
3. Envia análise para o SonarQube

### Apenas Análise (sem testes)

```bash
npm run sonar
```

### Análise com Quality Gate

```bash
npm run sonar:check
```

Este comando aguarda o Quality Gate e falha se não passar.

## 📈 Métricas Analisadas

O SonarQube analisa:

- ✅ **Bugs** - Erros no código
- 🔒 **Vulnerabilidades** - Problemas de segurança
- 💡 **Code Smells** - Problemas de manutenibilidade
- 📊 **Cobertura de Testes** - % de código coberto
- 🔄 **Duplicação** - Código duplicado
- 🧠 **Complexidade Cognitiva** - Dificuldade de entender o código
- 📏 **Linhas de Código** - Tamanho do projeto
- 🔥 **Hotspots de Segurança** - Pontos críticos de segurança

## 🎯 Quality Gates

O projeto usa Quality Gates padrão do SonarQube:

- ✅ **Pass:** Análise passou
- ❌ **Fail:** Análise falhou (bloqueia deploy se configurado)

### Critérios Padrão:

- Cobertura de testes ≥ 80%
- Duplicação < 3%
- Bugs = 0 (críticos)
- Vulnerabilidades = 0 (críticas)
- Code Smells < threshold

## 🔧 Configuração Avançada

### Excluir Arquivos da Análise

Edite `sonar-project.properties`:

```properties
sonar.exclusions=node_modules/**,dist/**,coverage/**,**/*.spec.ts
```

### Incluir Apenas Arquivos Específicos

```properties
sonar.inclusions=src/**/*.ts,src/**/*.js
```

### Configurar Cobertura

```properties
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.spec.ts,**/*.d.ts
```

## 🐳 Docker

### Ver Logs do SonarQube

```bash
docker-compose logs -f sonarqube
```

### Reiniciar SonarQube

```bash
docker-compose restart sonarqube
```

### Parar SonarQube

```bash
docker-compose stop sonarqube sonarqube_db
```

### Remover Dados (⚠️ CUIDADO!)

```bash
docker-compose down -v
```

Isso remove todos os dados do SonarQube!

## 🔗 Integração com CI/CD

### GitHub Actions

Crie `.github/workflows/sonar.yml`:

```yaml
name: SonarQube Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  sonar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:cov
      
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

### GitLab CI

Crie `.gitlab-ci.yml`:

```yaml
sonar:
  image: node:18
  stage: test
  script:
    - npm ci
    - npm run test:cov
    - sonar-scanner
  only:
    - main
    - develop
    - merge_requests
```

## 📝 Comandos Úteis

```bash
# Ver status do SonarQube
docker-compose ps sonarqube

# Ver logs em tempo real
docker-compose logs -f sonarqube

# Reiniciar SonarQube
docker-compose restart sonarqube

# Executar análise
npm run sonar:local

# Verificar Quality Gate
npm run sonar:check
```

## 🆘 Troubleshooting

### SonarQube não inicia

1. Verifique se a porta 9000 está livre:
```bash
netstat -ano | findstr :9000  # Windows
lsof -i :9000                 # Linux/Mac
```

2. Verifique os logs:
```bash
docker-compose logs sonarqube
```

3. Verifique memória disponível (SonarQube precisa de pelo menos 2GB)

### Erro de conexão com banco

Verifique se o `sonarqube_db` está rodando:
```bash
docker-compose ps sonarqube_db
```

### Token inválido

Gere um novo token no SonarQube:
1. Acesse: http://localhost:9000
2. Vá em: **My Account** → **Security** → **Generate Tokens**

## 📚 Referências

- [Documentação SonarQube](https://docs.sonarqube.org/)
- [SonarScanner](https://docs.sonarsource.com/sonarqube/analyzing-source-code/scanners/sonarscanner/)
- [Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)

---

**Última atualização:** 02/12/2025

