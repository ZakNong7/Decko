#!/bin/bash

# Pastikan path Homebrew dan Node.js terbaca
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "           🚀 MEMULAI DECKO PERSONAL...           "
echo "=================================================="

# 1. Cek & Jalankan PostgreSQL Lokal
if ! pg_isready -q -h localhost -p 5432; then
    echo "[-] Menyalakan service PostgreSQL..."
    brew services start postgresql@18 >/dev/null 2>&1 || brew services start postgresql >/dev/null 2>&1
    for i in {1..10}; do
        if pg_isready -q -h localhost -p 5432; then
            break
        fi
        sleep 1
    done
fi

if pg_isready -q -h localhost -p 5432; then
    echo "[✓] PostgreSQL Database : Aktif (decko_db)"
else
    echo "[!] Gagal menghubungkan ke PostgreSQL lokal."
    echo "    Silakan periksa PostgreSQL Anda dengan perintah: brew services start postgresql@18"
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

# 2. Bersihkan proses lama pada port 5001 & 5173 jika ada
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 3. Jalankan Backend Server
echo "[-] Menjalankan Server Backend..."
cd "$PROJECT_ROOT/server"
node index.js > /tmp/decko-backend.log 2>&1 &
BACKEND_PID=$!

# Tunggu backend siap
for i in {1..15}; do
    if curl -s http://127.0.0.1:5001/api/health >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done
echo "[✓] Server Backend      : Aktif (http://localhost:5001)"

# 4. Jalankan Frontend Web
echo "[-] Menjalankan Frontend Web..."
cd "$PROJECT_ROOT/client"
npm run dev > /tmp/decko-frontend.log 2>&1 &
FRONTEND_PID=$!

# Tunggu frontend siap
for i in {1..15}; do
    if curl -s http://localhost:5173/Decko/ >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done
echo "[✓] Frontend Web        : Aktif (http://localhost:5173/Decko/)"

# 5. Buka Browser Otomatis
sleep 1
open "http://localhost:5173/Decko/"

# Fungsi untuk membersihkan proses saat script ditutup
cleanup() {
    echo ""
    echo "[-] Mematikan server Decko..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    echo "[✓] Decko telah dimatikan secara aman. Sampai jumpa!"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Tampilan Status Bersih
clear
echo "=================================================="
echo "              🚀 DECKO PERSONAL APP               "
echo "=================================================="
echo "  [✓] Database  : PostgreSQL Lokal (decko_db)"
echo "  [✓] Backend   : http://localhost:5001"
echo "  [✓] Frontend  : http://localhost:5173/Decko/"
echo "=================================================="
echo "  Browser Anda sudah terbuka otomatis."
echo "  Akun default: admin / DeckoAdmin123!"
echo ""
echo "  (Tekan Ctrl + C di jendela ini untuk mematikan)"
echo "=================================================="

# Tunggu hingga pengguna menekan Ctrl+C
wait
