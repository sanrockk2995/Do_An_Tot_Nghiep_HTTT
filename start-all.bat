@echo off
title ROUTINE - Khoi dong toan bo he thong
color 0B

rem ============================================================
rem  BAM DOI DE CHAY TOAN BO HE THONG ROUTINE:
rem    1. Backend Spring Boot (port 8080) - cua so rieng
rem    2. Frontend ReactJS   (port 5173) - cua so rieng
rem  Sau khi ca hai san sang, mo trinh duyet: http://localhost:5173
rem ============================================================

set "ROOT=%~dp0"

echo.
echo  ================================================
echo     ROUTINE - Quan ly ban quan ao thoi trang
echo     Dang khoi dong backend + frontend...
echo  ================================================
echo.

echo  [1/2] Khoi dong BACKEND - port 8080...
start "ROUTINE Backend" cmd /k ""%ROOT%run-backend.bat""

echo  [2/2] Khoi dong FRONTEND - port 5173...
start "ROUTINE Frontend" cmd /k ""%ROOT%run-frontend.bat""

echo.
echo  Da khoi dong xong!
echo.
echo   * Cho khoang 20-30 giay de backend san sang. Lan dau chay
echo     Flyway se tu tao 19 bang + du lieu mau tren DB.
echo   * Sau do mo:  http://localhost:5173
echo.
echo   Tai khoan mau - mat khau chung: 123456
echo     admin@routine.vn      - Quan tri vien
echo     sales@routine.vn      - Nhan vien ban hang
echo     kho@routine.vn        - Nhan vien kho
echo     keToan@routine.vn     - Ke toan
echo     khach@routine.vn      - Khach hang
echo.
echo  Cua so nay se dong sau 15 giay...
timeout /t 15 >nul
