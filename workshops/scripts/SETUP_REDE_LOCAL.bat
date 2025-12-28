@echo off
echo ========================================
echo Configuracao de Acesso na Rede Local
echo ========================================
echo.
echo Seu IP na rede: 192.168.1.60
echo.
echo Para acessar de outros dispositivos na mesma rede:
echo 1. Configure o arquivo hosts em cada dispositivo
echo 2. Adicione esta linha ao arquivo hosts:
echo.
echo    192.168.1.60    oficinartee.localhost
echo.
echo 3. Acesse no navegador: http://oficinartee.localhost:3000
echo.
echo OU use o IP diretamente:
echo    http://192.168.1.60:3000
echo.
echo ========================================
echo.
echo Deseja abrir o arquivo hosts para edicao? (S/N)
set /p resposta=
if /i "%resposta%"=="S" (
    notepad C:\Windows\System32\drivers\etc\hosts
)
echo.
echo Lembre-se de executar o frontend com: npm run dev
echo Isso permitira conexoes da rede local.
echo.
pause

