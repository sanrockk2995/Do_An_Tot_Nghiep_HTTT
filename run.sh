#!/usr/bin/env bash
# ============================================================
#  ROUTINE - Khoi dong backend + frontend (Git Bash / WSL / Linux)
#  Chay: ./run.sh   (hoac: bash run.sh)
#  Bam Ctrl+C de tat ca ca hai.
# ============================================================

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo " ================================================"
echo "    ROUTINE - Quan ly ban quan ao thoi trang"
echo "    Dang khoi dong backend + frontend..."
echo " ================================================"
echo ""

cleanup() {
  echo ""
  echo " Dang tat cac tien trinh..."
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null
  pkill -f "vite" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# ---- Backend -------------------------------------------------
echo " [1/2] BACKEND (port 8080)..."
(
  cd "$ROOT/backend"
  export JAVA_HOME="${JAVA_HOME:-/c/Program Files/Java/jdk-23}"
  export PATH="$JAVA_HOME/bin:$PATH"
  "$ROOT/tools/apache-maven-3.9.9/bin/mvn" spring-boot:run \
    -Dmaven.repo.local="$ROOT/tools/.m2" \
    -Dspring-boot.run.jvmArguments="-Djava.net.preferIPv4Stack=false -Djava.net.preferIPv6Addresses=true"
) &
BACKEND_PID=$!

# ---- Frontend -------------------------------------------------
sleep 3
echo " [2/2] FRONTEND (port 5173)..."
(
  cd "$ROOT/frontend"
  [ -d node_modules ] || npm install
  npm run dev -- --host ::
) &
FRONTEND_PID=$!

echo ""
echo " Da khoi dong xong!"
echo "   * Cho ~20-30 giay de backend san sang, roi mo: http://localhost:5173"
echo "   * Tai khoan mau (mat khau chung 123456): admin@routine.vn,"
echo "     sales@routine.vn, kho@routine.vn, keToan@routine.vn, khach@routine.vn"
echo ""
echo " Bam Ctrl+C de tat ca hai."
echo ""

wait
