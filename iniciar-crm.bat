@echo off
setlocal

REM Este script fica na pasta do projeto — %~dp0 resolve para essa pasta
REM automaticamente, então funciona em qualquer computador sem precisar
REM editar caminhos.
cd /d "%~dp0"

echo ============================================
echo   Arthur Franco Design - CRM
echo   Atualizando...
echo ============================================
git pull origin claude/arthur-franco-crm-wk64mo

echo.
echo Iniciando o CRM local (API + site)...
echo Deixe esta janela aberta enquanto estiver usando o CRM.
echo.

REM Abre o navegador automaticamente depois de alguns segundos, dando
REM tempo do servidor subir.
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:5173"

call npm run dev

endlocal
