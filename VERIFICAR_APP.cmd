@echo off
cd /d "%~dp0"
if not exist node_modules\vite\bin\vite.js (
  echo Instalando dependencias por primera vez...
  call npm.cmd install --offline=false
  if errorlevel 1 pause & exit /b 1
)
call npm.cmd run build
if errorlevel 1 (
  echo La compilacion fallo.
) else (
  echo La compilacion termino correctamente.
)
pause

