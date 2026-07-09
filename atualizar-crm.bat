@echo off
setlocal

REM Fica na pasta do projeto — %~dp0 resolve sozinho, funciona em
REM qualquer computador sem editar caminhos.
cd /d "%~dp0"

echo ============================================
echo   Arthur Franco Design - CRM
echo   Atualizando e reiniciando o servico PM2...
echo ============================================

REM Para o servico ANTES de mexer em qualquer arquivo — enquanto ele está
REM rodando, o Windows mantém o arquivo do Prisma travado e o "prisma
REM generate" falha com erro EPERM.
echo Parando o servico para liberar os arquivos...
pm2 stop crm-vendas-api

git pull origin claude/arthur-franco-crm-wk64mo
if errorlevel 1 (
  echo.
  echo ERRO no git pull. Veja a mensagem acima.
  pause
  exit /b 1
)

call npm install
if errorlevel 1 (
  echo.
  echo ERRO ao instalar dependencias. Veja a mensagem acima.
  pause
  exit /b 1
)

echo.
echo Aplicando mudancas no banco de dados (se houver)...
call npx prisma migrate deploy
if errorlevel 1 (
  echo.
  echo ERRO ao atualizar o banco de dados. Veja a mensagem acima.
  pause
  exit /b 1
)

echo.
echo Atualizando o Prisma Client (gerado a partir do schema)...
call npx prisma generate
if errorlevel 1 (
  echo.
  echo ERRO ao gerar o Prisma Client. Veja a mensagem acima.
  pause
  exit /b 1
)

call npm run build
if errorlevel 1 (
  echo.
  echo ERRO ao compilar. Veja a mensagem acima.
  pause
  exit /b 1
)

pm2 restart crm-vendas-api

echo.
echo Pronto! Abra http://localhost:3001 no navegador.
pause
endlocal
