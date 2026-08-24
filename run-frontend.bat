@echo off
title ROUTINE Frontend - port 5173
color 0D

rem ============================================================
rem  Chay FRONTEND ReactJS - Vite dev server (Mở port LAN).
rem  Dong cua so nay = tat frontend.
rem ============================================================

set "ROOT=%~dp0"

echo.
echo  ============================================
echo    ROUTINE FRONTEND - http://localhost:5173
echo    Dong cua so nay de TAT frontend.
echo  ============================================
echo.

cd /d "%ROOT%frontend"

if not exist node_modules (
  echo  [i] Lan dau chay - dang cai dat thu vien, vui long cho...
  echo.
  call npm install
)

call npm run dev -- --host 0.0.0.0

echo.
echo  Frontend da dung hoac co loi khi khoi dong.
echo  Nhan phim bat ky de dong cua so...
pause >nul