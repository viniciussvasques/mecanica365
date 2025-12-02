@echo off
echo =====================================================
echo Configurando ambiente de desenvolvimento do Carvex Brasil
echo =====================================================

echo.
echo [1/5] Instalando dependências globais...
npm install -g @nestjs/cli typescript ts-node prisma

cd backend

echo.
echo [2/5] Instalando dependências do projeto...
npm install

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao instalar as dependências. Verifique o log acima.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Gerando cliente do Prisma...
npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao gerar o cliente do Prisma. Verifique o log acima.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/5] Criando arquivo .env...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado a partir do exemplo.
    echo Por favor, configure as variáveis de ambiente no arquivo .env
) else (
    echo O arquivo .env já existe. Nada a fazer.
)

echo.
echo [5/5] Configuração concluída com sucesso!
echo.
echo Próximos passos:
echo 1. Configure o arquivo .env com as credenciais do banco de dados
echo 2. Execute 'docker-compose up -d' para subir os containers
echo 3. Execute 'npx prisma migrate dev' para aplicar as migrações
echo 4. Execute 'npm run start:dev' para iniciar o servidor
echo.
echo Acesse a documentação da API em: http://localhost:3000/api

pause
