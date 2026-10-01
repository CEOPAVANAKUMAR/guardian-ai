#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "======================================================================"
echo "          GUARDIANAI : RUNTIME TRUST INFRASTRUCTURE"
echo "======================================================================"
echo ""

echo "[*] Initializing database and generating demonstration PDFs..."
python3 scripts/seed_db.py
python3 scripts/generate_pdfs.py

echo ""
echo "[*] Starting GuardianAI Backend API Server on http://127.0.0.1:8000 ..."
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "[*] Starting GuardianAI Cybersecurity Frontend on http://localhost:5173 ..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo ""
echo "======================================================================"
echo "GUARDIANAI SERVICES STARTED SUCCESSFULLY!"
echo "======================================================================"
echo ""
echo "  Cybersecurity Frontend Dashboard : http://localhost:5173"
echo "  GuardianAI Backend API Gateway   : http://127.0.0.1:8000"
echo "  Interactive Swagger / OpenAPI    : http://127.0.0.1:8000/docs"
echo ""
echo "DEMO INSTRUCTIONS:"
echo "  1. Open http://localhost:5173 in your browser."
echo "  2. Navigate to 'Attack Playground' to launch live attack scenarios."
echo "  3. Test Poisoned PDF attacks, Secret Exfiltration, and DROP TABLE."
echo "  4. View human-in-the-loop approvals with safe impact previews."
echo "  5. Verify the cryptographic HMAC-SHA256 audit chain and test tampering."
echo ""
echo "Press Ctrl+C to stop all services..."
wait
