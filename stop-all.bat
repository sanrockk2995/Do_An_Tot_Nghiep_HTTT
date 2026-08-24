@echo off
title ROUTINE - Tat toan bo he thong
color 0C

rem ============================================================
rem  TAT moi tien trinh cua he thong Routine:
rem    - Java (Spring Boot backend)
rem    - Node (Vite dev server frontend)
rem ============================================================

echo.
echo  Dang tat cac tien trinh ROUTINE...
echo.

echo  [1/2] Tat backend - java...
taskkill /f /im java.exe >nul 2>&1 && echo        Da tat. || echo        Khong thay tien trinh nao.

echo  [2/2] Tat frontend - node...
taskkill /f /im node.exe >nul 2>&1 && echo        Da tat. || echo        Khong thay tien trinh nao.

echo.
echo  Da tat xong. Dong sau 5 giay...
timeout /t 5 >nul
