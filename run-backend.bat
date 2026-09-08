@echo off
title ROUTINE Backend - port 8080
color 0A

rem ============================================================
rem  Chay BACKEND Spring Boot (ket noi MySQL 10.216.1.218).
rem  File nay duoc goi boi start-all.bat hoac bam doi truc tiep.
rem  Dong cua so nay = tat backend.
rem ============================================================

set "ROOT=%~dp0"
if not exist "%JAVA_HOME%\bin\javac.exe" (
  if exist "D:\APP\Java\jdk-25.0.4.1" (
    set "JAVA_HOME=D:\APP\Java\jdk-25.0.4.1"
  ) else if exist "C:\Program Files\Java\latest\jdk-25" (
    set "JAVA_HOME=C:\Program Files\Java\latest\jdk-25"
  ) else if exist "C:\Program Files\Java\jdk-23" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-23"
  )
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo  ============================================
echo    ROUTINE BACKEND - http://localhost:8080
echo    DB: routine_db @ 10.216.1.218:3306
echo    Dong cua so nay de TAT backend.
echo  ============================================
echo.

cd /d "%ROOT%backend"

rem Tu giai phong port 8080 neu van con tien trinh backend cu
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
  echo  [i] Port 8080 dang bi chiem - tat tien trinh cu PID %%a...
  taskkill /f /pid %%a >nul 2>&1
)

call "%ROOT%tools\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run -Dmaven.repo.local="%ROOT%tools\.m2" -Dspring-boot.run.jvmArguments="-Djava.net.preferIPv4Stack=false -Djava.net.preferIPv6Addresses=true"

echo.
echo  Backend da dung hoac co loi khi khoi dong.
echo  Nhan phim bat ky de dong cua so...
pause >nul
