@echo off
echo ========================================
echo Configuracao de Acesso na Rede Local
echo ========================================
echo.
echo Este script vai adicionar a entrada no arquivo hosts
echo para permitir acesso a oficinartee.localhost de outro PC.
echo.
echo IMPORTANTE: Execute este script como ADMINISTRADOR!
echo.
pause

:: Verificar se está rodando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERRO: Este script precisa ser executado como Administrador!
    echo Clique com botao direito e selecione "Executar como administrador"
    pause
    exit /b 1
)

echo.
echo Digite o IP do servidor (ex: 192.168.1.60):
set /p SERVER_IP=

if "%SERVER_IP%"=="" (
    echo IP invalido!
    pause
    exit /b 1
)

echo.
echo Adicionando entrada ao arquivo hosts...
echo.

:: Verificar se já existe a entrada
findstr /C:"oficinartee.localhost" C:\Windows\System32\drivers\etc\hosts >nul 2>&1
if %errorLevel% equ 0 (
    echo A entrada ja existe no arquivo hosts.
    echo.
    echo Deseja substituir? (S/N)
    set /p REPLACE=
    if /i not "%REPLACE%"=="S" (
        echo Operacao cancelada.
        pause
        exit /b 0
    )
    echo.
    echo Removendo entrada antiga...
    powershell -Command "(Get-Content C:\Windows\System32\drivers\etc\hosts) | Where-Object {$_ -notmatch 'oficinartee.localhost'} | Set-Content C:\Windows\System32\drivers\etc\hosts"
)

:: Adicionar nova entrada
echo %SERVER_IP%    oficinartee.localhost >> C:\Windows\System32\drivers\etc\hosts

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo Configuracao concluida com sucesso!
    echo ========================================
    echo.
    echo Agora voce pode acessar:
    echo   http://oficinartee.localhost:3000
    echo.
    echo Teste a conexao:
    ping oficinartee.localhost
) else (
    echo.
    echo ERRO ao adicionar entrada ao arquivo hosts!
    echo Verifique as permissoes de administrador.
)

echo.
pause

