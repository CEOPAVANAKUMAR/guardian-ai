# GuardianAI Production Deployment Guide

This guide provides complete instructions for deploying the **GuardianAI Runtime Trust Infrastructure & SOC Console** to GitHub and live cloud hosting platforms.

---

## 1. Architecture Overview

GuardianAI consists of:
- **FastAPI API & Runtime Security Gateway** (`/api/v1/*`, `/docs`, `/health`)
- **React 18 + Vite Cybersecurity SOC Console** (Mounted as a single-page application at `/`)
- **SQLite Database** (Auto-initializing and self-seeding with 1,000+ realistic enterprise audit records)
- **HMAC-SHA256 Cryptographic Audit Ledger & Incident Classifier**

Because the FastAPI server natively serves both the API and the compiled React production frontend from the same origin, you can deploy the entire application as a **Single Web Service** on Render, Railway, Fly.io, or Docker without any cross-origin (CORS) or domain configuration issues.

---

## 2. Pushing Code to Your GitHub Repository

Your GitHub repository is located at:
`https://github.com/CEOPAVANAKUMAR/guardian-ai`

### Step-by-Step Push Instructions (from project directory):

```bash
# 1. Initialize local Git repository
git init

# 2. Stage all project files (excluding venv, node_modules, and secrets via .gitignore)
git add .

# 3. Create your initial commit
git commit -m "feat: complete GuardianAI runtime trust infrastructure, SOC console, and deployment configs"

# 4. Set branch to main and attach remote
git branch -M main
git remote add origin https://github.com/CEOPAVANAKUMAR/guardian-ai.git

# 5. Push to GitHub
git push -u origin main
```

*(If your GitHub repository already contains an initial commit or README, you can sync before pushing: `git pull origin main --rebase && git push -u origin main`)*

---

## 3. Option A: 1-Click Free Cloud Deployment on Render (Recommended)

Render offers free hosting for web services and natively supports Python and Node.js.

### Method 1: Using the Included `render.yaml` Blueprint (Easiest)
1. Sign up or log into [Render.com](https://render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `CEOPAVANAKUMAR/guardian-ai`.
4. Render will detect `render.yaml` automatically.
5. Click **Apply**.
6. Render builds both the frontend and backend, sets up the database, and gives you a live public HTTPS URL (e.g. `https://guardian-ai.onrender.com`).

### Method 2: Manual Web Service Setup on Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect `https://github.com/CEOPAVANAKUMAR/guardian-ai`.
4. Configure settings:
   - **Name**: `guardian-ai`
   - **Region**: Oregon (US West) or Frankfurt (EU)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     npm --prefix frontend install && npm --prefix frontend run build && pip install -r requirements.txt && python scripts/seed_db.py && python scripts/generate_pdfs.py
     ```
   - **Start Command**:
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: Free
5. **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |
   | `GUARDIAN_ENABLED` | `true` | Enables deterministic firewall |
   | `GUARDIAN_SECRET_KEY` | *(Click Generate)* | Secret key for HMAC audit chaining |
   | `CAPABILITY_TOKEN_SECRET` | *(Click Generate)* | Secret key for signing capability tokens |
   | `AUTH_SECRET_KEY` | *(Click Generate)* | Secret key for enterprise session tokens |
   | `DEMO_API_KEY` | `GUARDIAN_FAKE_SECRET_12345` | Sample secret for exfiltration tests |
   | `GUARDIAN_SMTP_EMAIL` | *(optional)* | Your Gmail address for live OTP/Alerts |
   | `GUARDIAN_SMTP_APP_PASSWORD` | *(optional)* | 16-character Google App Password |
6. Click **Create Web Service**.

---

## 4. Option B: Docker Container Deployment

GuardianAI includes a production-grade multi-stage `Dockerfile`.

### Build & Run Locally or on any Cloud VPS (AWS EC2, DigitalOcean, Linode):

```bash
# Build the unified production container
docker build -t guardianai:latest .

# Run container on port 8000
docker run -d -p 8000:8000 \
  -e GUARDIAN_SECRET_KEY=production_secret_hmac_key \
  -e CAPABILITY_TOKEN_SECRET=production_token_secret \
  -e AUTH_SECRET_KEY=production_auth_secret \
  --name guardianai \
  guardianai:latest
```

Open your browser at `http://localhost:8000` (or `http://YOUR_SERVER_IP:8000`).

---

## 5. Option C: Multi-Container via Docker Compose

To run backend and frontend in isolated containers behind an Nginx reverse proxy:

```bash
docker compose up --build -d
```

- **Frontend UI (Nginx)**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`

---

## 6. Option D: Split Deployment (Vercel Frontend + Render Backend)

If you prefer to host the frontend on Vercel:

1. **Deploy Backend to Render or Railway**:
   - Note the backend URL (e.g. `https://guardian-backend.onrender.com`).
2. **Deploy Frontend to Vercel**:
   - In `vercel.json`, replace `https://YOUR_BACKEND_URL` with your live backend URL.
   - Run `vercel` or link `CEOPAVANAKUMAR/guardian-ai` in the Vercel dashboard.
   - Set Framework Preset to **Vite**, Root Directory to `frontend`.

---

## 7. Post-Deployment Verification Checklist

Once deployed to your live URL:
1. Navigate to the root URL (e.g. `https://guardian-ai.onrender.com`).
2. Verify the cybersecurity login screen loads cleanly.
3. Test OTP generation (in DEV mode or via configured Gmail SMTP).
4. Enter the **Attack Playground** and execute sample attacks (Poisoned PDF, SQL Injection) to confirm runtime interception.
5. Visit `/docs` to inspect the live OpenAPI specifications.
