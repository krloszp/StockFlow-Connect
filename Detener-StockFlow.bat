@echo off
title StockFlow Connect - Detener Servidores
color 0C

echo ===============================================================
echo      🔴 DETENIENDO SERVIDORES DE STOCKFLOW CONNECT 
echo ===============================================================
echo.

taskkill /FI "WINDOWTITLE eq StockFlow Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq StockFlow Frontend App*" /F >nul 2>&1

echo ✅ Servidores detenidos correctamente.
echo.
pause
