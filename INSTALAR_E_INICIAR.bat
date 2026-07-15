@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Limiar - Instalacao facil

cd /d "%~dp0"

echo.
echo ============================================================
echo              LIMIAR - INSTALACAO FACIL
echo ============================================================
echo.
echo Este assistente vai preparar o projeto e abrir o site.
echo Na primeira vez, o processo pode levar alguns minutos.
echo.

if not exist "package.json" goto pasta_incorreta

where node.exe >nul 2>&1
if errorlevel 1 goto node_ausente

for /f "tokens=1,2 delims=." %%A in ('node.exe -p "process.versions.node"') do (
    set "NODE_MAJOR=%%A"
    set "NODE_MINOR=%%B"
)

if %NODE_MAJOR% LSS 20 goto node_antigo
if %NODE_MAJOR% EQU 20 if %NODE_MINOR% LSS 9 goto node_antigo

echo [1/4] Node.js encontrado: versao
node.exe --version
echo.

set "PNPM_CMD="
where pnpm.cmd >nul 2>&1
if not errorlevel 1 set "PNPM_CMD=pnpm.cmd"
if defined PNPM_CMD goto gerenciador_pronto

where corepack.cmd >nul 2>&1
if not errorlevel 1 set "PNPM_CMD=corepack.cmd pnpm"
if defined PNPM_CMD goto gerenciador_pronto

where npx.cmd >nul 2>&1
if errorlevel 1 goto npm_ausente
set "PNPM_CMD=npx.cmd --yes pnpm@10"

:gerenciador_pronto
echo [2/4] Instalando as dependencias do projeto...
set "CI=true"
call %PNPM_CMD% install
set "INSTALL_EXIT=%ERRORLEVEL%"
set "CI="
if not "%INSTALL_EXIT%"=="0" goto falha_dependencias
echo.

echo [3/4] Preparando a configuracao local...
if exist ".env.local" (
    echo O arquivo .env.local ja existe e foi mantido.
) else (
    copy /y ".env.example" ".env.local" >nul
    if errorlevel 1 goto falha_ambiente
    echo Arquivo .env.local criado.
)
echo.

if /i "%~1"=="--install-only" goto somente_instalacao

echo [4/4] Instalacao concluida! Iniciando o Limiar...
echo.
echo ============================================================
echo                     COMO ACESSAR
echo ============================================================
echo.
echo 1. Mantenha esta janela aberta.
echo 2. Abra seu navegador.
echo 3. Acesse: http://localhost:3000
echo.
echo O navegador tambem sera aberto automaticamente.
echo Se a pagina aparecer antes do servidor ficar pronto,
echo aguarde alguns segundos e pressione F5 para recarregar.
echo.
echo Para desligar o Limiar, volte aqui e pressione Ctrl+C.
echo Enquanto o site estiver aberto, mensagens tecnicas do
echo servidor poderao aparecer abaixo. Isso e normal.
echo.
echo ============================================================
echo.

start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000'"
call %PNPM_CMD% dev

echo.
echo ============================================================
echo O servidor foi encerrado. O site nao esta mais acessivel.
echo Para abrir novamente, execute INSTALAR_E_INICIAR.bat.
echo ============================================================
pause
exit /b 0

:somente_instalacao
echo Instalacao concluida com sucesso.
exit /b 0

:node_ausente
echo [ERRO] O Node.js ainda nao esta instalado.
echo.
echo A pagina oficial sera aberta. Instale a versao LTS,
echo reinicie o computador e execute este arquivo novamente.
echo.
start "" "https://nodejs.org/"
pause
exit /b 1

:node_antigo
echo [ERRO] Seu Node.js e antigo demais: v%NODE_MAJOR%.%NODE_MINOR%
echo O Limiar precisa do Node.js 20.9 ou mais recente.
echo.
echo Instale a versao LTS atual e execute este arquivo novamente.
start "" "https://nodejs.org/"
pause
exit /b 1

:npm_ausente
echo [ERRO] Nao foi possivel encontrar pnpm, Corepack ou npx.
echo Reinstale o Node.js na versao LTS e tente novamente.
pause
exit /b 1

:pasta_incorreta
echo [ERRO] O package.json nao foi encontrado.
echo Mantenha este arquivo na pasta principal do projeto.
pause
exit /b 1

:falha_dependencias
echo.
echo [ERRO] Nao foi possivel instalar as dependencias.
echo Verifique sua conexao com a internet e tente novamente.
echo Se o erro continuar, copie a mensagem acima ao pedir ajuda.
pause
exit /b 1

:falha_ambiente
echo.
echo [ERRO] Nao foi possivel criar o arquivo .env.local.
echo Verifique se a pasta permite gravacao e tente novamente.
pause
exit /b 1
