@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo           GUARDIANAI : RUNTIME TRUST INFRASTRUCTURE
echo ======================================================================
echo.

cd /d "%~dp0"

echo [*] Initializing database and generating demonstration PDFs...
py -3 scripts\seed_db.py
py -3 scripts\generate_pdfs.py

echo.
echo [*] Starting GuardianAI Backend API Server on http://127.0.0.1:8000 ...
start "GuardianAI Backend API" cmd /k "py -3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Starting GuardianAI Cybersecurity Frontend on http://localhost:5173 ...
cd frontend
start "GuardianAI Frontend UI" cmd /k "npm run dev"
cd ..

echo.
echo ======================================================================
echo GUARDIANAI SERVICES STARTED SUCCESSFULLY!
echo ======================================================================
echo.
echo   Cybersecurity Frontend Dashboard : http://localhost:5173
echo   GuardianAI Backend API Gateway   : http://127.0.0.1:8000
echo   Interactive Swagger / OpenAPI    : http://127.0.0.1:8000/docs
echo.
echo DEMO INSTRUCTIONS:
echo   1. Open http://localhost:5173 in your browser.
echo   2. Navigate to 'Attack Playground' to launch live attack scenarios.
echo   3. Test Poisoned PDF attacks, Secret Exfiltration, and DROP TABLE.
echo   4. View human-in-the-loop approvals with safe impact previews.
echo   5. Verify the cryptographic HMAC-SHA256 audit chain and test tampering.
echo.
echo Press any key to stop this script (services will remain running in windows)...
pause >nul
