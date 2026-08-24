# ============================================================
#  ROUTINE - Khoi dong toan bo he thong (PowerShell)
#  Cach chay: bam chuot phai vao file -> "Run with PowerShell"
#             hoac tu terminal: .\run.ps1
# ============================================================

$ErrorActionPreference = 'Continue'
$Root = $PSScriptRoot

Write-Host ''
Write-Host ' ================================================' -ForegroundColor Cyan
Write-Host '    ROUTINE - Quan ly ban quan ao thoi trang'
Write-Host '    Dang khoi dong backend + frontend...'
Write-Host ' ================================================' -ForegroundColor Cyan
Write-Host ''

# ---- Backend -------------------------------------------------
Write-Host ' [1/2] Khoi dong BACKEND (port 8080)...' -ForegroundColor Green
$backendScript = Join-Path $Root 'run-backend.bat'
Start-Process -FilePath 'cmd.exe' -ArgumentList "/k", "`"$backendScript`"" -WindowStyle Normal

# ---- Frontend ------------------------------------------------
Write-Host ' [2/2] Khoi dong FRONTEND (port 5173)...' -ForegroundColor Green
$frontendScript = Join-Path $Root 'run-frontend.bat'
Start-Process -FilePath 'cmd.exe' -ArgumentList "/k", "`"$frontendScript`"" -WindowStyle Normal

Write-Host ''
Write-Host ' Da khoi dong xong!' -ForegroundColor Yellow
Write-Host ''
Write-Host '  * Cho khoang 20-30 giay de backend san sang (lan dau chay'
Write-Host '    Flyway se tu tao 19 bang + du lieu mau tren DB).'
Write-Host '  * Sau do mo:  http://localhost:5173'
Write-Host ''
Write-Host '  Tai khoan mau (mat khau chung: 123456):'
Write-Host '    admin@routine.vn      - Quan tri vien'
Write-Host '    sales@routine.vn      - Nhan vien ban hang'
Write-Host '    kho@routine.vn        - Nhan vien kho'
Write-Host '    keToan@routine.vn     - Ke toan'
Write-Host '    khach@routine.vn      - Khach hang'
Write-Host ''
