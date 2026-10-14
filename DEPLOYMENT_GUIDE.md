# 🍏 ArthaX 2.0 • Deployment & Architecture Guide

Welcome to the reimagined **ArthaX 2.0** — an Apple Cupertino / macOS-inspired financial intelligence dashboard powered by **Meta Prophet** time-series forecasting, live **Yahoo Finance** analytics, and real-time **USD-to-INR currency conversion**.

---

## 🏗️ Architecture Overview

The codebase is structured in a **Decoupled Monorepo**, separating the client interface from the machine learning engine:

```
ArthaX 2.0/
├── frontend/                   <-- React (Vite) Apple UI (Deploy to Vercel)
│   ├── src/
│   │   ├── components/         <-- Navbar, StockChart, HeroTicker, MetricsGrid, SpotlightModal
│   │   ├── api.js              <-- Live API + resilient offline fallback
│   │   ├── mockData.js         <-- Authentic market datasets & simulations
│   │   ├── App.jsx             <-- Main Cupertino Dashboard
│   │   └── index.css           <-- Apple Design Tokens & Frosted Glassmorphism
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    <-- FastAPI ML Engine (Deploy to Render / Koyeb)
│   ├── main.py                 <-- Endpoints: /api/stock, /api/forecast, /api/search, /api/health
│   ├── requirements.txt        <-- FastAPI, Uvicorn, yfinance, Prophet, Pandas
│   └── Procfile                <-- Render startup command
│
└── DEPLOYMENT_GUIDE.md         <-- This complete guide
```

---

## 🔒 100% Code Privacy & Zero Visibility

By migrating away from Hugging Face Spaces free tier:
1. **Private GitHub Repository**: Keep your GitHub repository **Private**.
2. **Vercel Frontend**: Connects directly to your private repo. Vercel only serves minified, bundled web code. No source files or server code are ever exposed.
3. **Render Backend**: Connects to your private repo. Only exposes JSON data via REST endpoints. Your algorithms, Prophet configurations, and prompts remain completely hidden inside the backend server.

---

## 🚀 How to Run Locally

### 1. Launch the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser.  
*(The frontend has built-in demo simulations for Apple, Nvidia, Tesla, Reliance, and Bitcoin so you can experience the full UI immediately even if the backend is not yet started).*

### 2. Launch the FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend will start at **`http://localhost:8000`**.  
The frontend will automatically detect the live backend and switch from local mode to `AI Engine Connected`.

---

## ☁️ Free 24/7 Deployment Guide (Without Sleeping)

### Step 1: Push Your Code to a Private GitHub Repo
1. Create a new **Private** repository on GitHub (e.g. `github.com/your-username/arthax-2.0`).
2. Push your files to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: ArthaX 2.0 Apple UI + FastAPI backend"
   git branch -M main
   git remote add origin https://github.com/your-username/arthax-2.0.git
   git push -u origin main
   ```

---

### Step 2: Deploy Backend to Render (100% Free)
1. Sign in to [Render.com](https://render.com/) with GitHub.
2. Click **New +** -> **Web Service**.
3. Select your private `arthax-2.0` repository.
4. Configure these settings:
   - **Name:** `arthax-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Click **Create Web Service**.
6. Once deployed, copy your live backend URL (e.g. `https://arthax-api.onrender.com`).

---

### Step 3: Prevent Render from Sleeping (The UptimeRobot Trick)
Render free services spin down after 15 minutes of inactivity. We keep it awake 24/7 for free:
1. Go to [UptimeRobot.com](https://uptimerobot.com/) and create a free account.
2. Click **Add New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `ArthaX Backend Keep-Alive`
   - **URL:** `https://arthax-api.onrender.com/api/health`
   - **Monitoring Interval:** Every `5 minutes`
3. Click **Create Monitor**.
4. **Done!** Because UptimeRobot sends a request every 5 minutes, Render never hits the 15-minute inactivity limit and **never goes to sleep**.

---

### Step 4: Deploy Frontend to Vercel (100% Free)
1. Sign in to [Vercel.com](https://vercel.com/) with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your private `arthax-2.0` repository.
4. Configure the build settings:
   - **Root Directory:** Click Edit and select `frontend`.
   - **Framework Preset:** `Vite`
5. Under **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://arthax-api.onrender.com` (your Render backend URL from Step 2)
6. Click **Deploy**.
7. In ~30 seconds, your site is live globally on a free `.vercel.app` domain (or custom domain) with 0ms cold starts!
