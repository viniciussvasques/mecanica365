# 🚀 SonarQube - Quick Start

## ⚡ Configuração Rápida (5 minutos)

### 1️⃣ Subir o SonarQube

```bash
docker-compose up -d sonarqube sonarqube_db
```

Aguarde 2-3 minutos para inicializar.

### 2️⃣ Acessar e Criar Projeto

1. Acesse: http://localhost:9000
2. Login: `admin` / `admin` (altere a senha)
3. Clique em **"Create Project"**
4. Escolha **"Manually"**
5. Preencha:
   - **Project display name:** `Mecânica365 Workshops Backend`
   - **Project key:** `mecanica365-workshops-backend`
6. Clique em **"Set Up"**
7. Escolha **"Locally"**
8. Escolha **"Generate a token"**
9. Dê um nome (ex: `local-analysis`)
10. **COPIE O TOKEN** (você não verá novamente!)

### 3️⃣ Executar Primeira Análise

**Opção 1: Via Script PowerShell (Recomendado)**

```powershell
# Definir token como variável de ambiente
$env:SONAR_TOKEN="seu-token-aqui"

# Executar análise com cobertura
npm run sonar:with-coverage
```

**Opção 2: Via Script Direto**

```powershell
.\scripts\sonar-scanner.ps1 -Token "seu-token-aqui" -WithCoverage
```

**Opção 3: Apenas Análise (sem testes)**

```powershell
$env:SONAR_TOKEN="seu-token-aqui"
npm run sonar
```

### 4️⃣ Ver Resultados

Acesse: http://localhost:9000

Você verá:
- ✅ Bugs
- 🔒 Vulnerabilidades
- 💡 Code Smells
- 📊 Cobertura de Testes
- 🔄 Duplicação
- 🧠 Complexidade Cognitiva

## 📝 Comandos Úteis

```powershell
# Ver status do SonarQube
docker-compose ps sonarqube

# Ver logs
docker-compose logs -f sonarqube

# Reiniciar
docker-compose restart sonarqube

# Executar análise com cobertura
$env:SONAR_TOKEN="seu-token"
npm run sonar:with-coverage

# Análise com Quality Gate (bloqueia se falhar)
$env:SONAR_TOKEN="seu-token"
npm run sonar:check
```

## 🔐 Configurar Token Permanentemente

### Windows (PowerShell Profile)

Edite `$PROFILE`:

```powershell
notepad $PROFILE
```

Adicione:

```powershell
$env:SONAR_TOKEN="seu-token-aqui"
```

### Ou use arquivo .env.local

Crie `workshops/backend/.env.local`:

```env
SONAR_TOKEN=seu-token-aqui
```

E carregue antes de executar:

```powershell
# PowerShell
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
```

## 🎯 Próximos Passos

1. ✅ Execute a primeira análise
2. 📊 Revise os resultados no SonarQube
3. 🔧 Corrija os problemas encontrados
4. 🔄 Execute análise novamente
5. 🚀 Configure Quality Gates
6. 🔗 Integre com CI/CD (opcional)

## 🆘 Problemas Comuns

### Token não funciona

Gere um novo token:
1. http://localhost:9000
2. **My Account** → **Security** → **Generate Tokens**

### SonarQube não inicia

Verifique memória (precisa de 2GB+):
```powershell
docker-compose logs sonarqube
```

### Erro de conexão

Verifique se está rodando:
```powershell
docker-compose ps sonarqube sonarqube_db
```

---

**Dica:** Use `npm run sonar:with-coverage` regularmente para manter a qualidade do código! 🎯

