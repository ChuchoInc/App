@echo off
REM Sirve la PWA English ChuchoIng en la red local (WiFi).
REM Abre en el celular: http://LA-IP-DE-ESTA-PC:8080

cd /d "%~dp0english-chuchoing"

echo.
echo  ============================================================
echo   English ChuchoIng - servidor local en el puerto 8080
echo  ============================================================
echo.
echo  IPs de esta PC (usa la de tu WiFi, normalmente 192.168.x.x):
echo.
ipconfig | findstr /i "IPv4"
echo.
echo  En el celular abre:  http://TU-IP:8080
echo  (Si Windows pregunta por el Firewall, permite redes privadas)
echo.
echo  Presiona Ctrl+C para detener el servidor.
echo.

where python >nul 2>&1
if %errorlevel%==0 (
  python -m http.server 8080 --bind 0.0.0.0
) else (
  py -m http.server 8080 --bind 0.0.0.0
)
