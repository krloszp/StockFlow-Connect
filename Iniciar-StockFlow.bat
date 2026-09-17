@echo off
title StockFlow Connect

echo ===============================================================
echo      INICIANDO PLATAFORMA STOCKFLOW CONNECT (pnpm)
echo ===============================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando dependencias de Backend...
if not exist "%~dp0backend\node_modules" (
    echo Instalando dependencias de Backend con pnpm...
    cd /d "%~dp0backend"
    call pnpm install
    call pnpm approve-builds --all
    cd /d "%~dp0"
    echo Dependencias de Backend instaladas correctamente.
    echo.
)

echo [2/3] Verificando dependencias de Frontend...
if not exist "%~dp0frontend\node_modules" (
    echo Instalando dependencias de Frontend con pnpm...
    cd /d "%~dp0frontend"
    call pnpm install
    call pnpm approve-builds --all
    cd /d "%~dp0"
    echo Dependencias de Frontend instaladas correctamente.
    echo.
)

echo [3/3] Iniciando Servidores...
start "Backend_API" cmd /k "cd /d %~dp0backend && pnpm dev"
start "Frontend_App" cmd /k "cd /d %~dp0frontend && pnpm dev"

echo.
echo ===============================================================
echo  Servidores iniciados exitosamente. Abriendo navegador...
echo ===============================================================
echo.

timeout /t 5 /nobreak >nul
start http://localhost:3000
