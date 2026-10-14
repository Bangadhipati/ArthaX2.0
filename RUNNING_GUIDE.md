# 🚀 ArthaX 2.0 • Local Execution & Running Guide

This guide walks you through running both the **React Frontend** and the **FastAPI + Prophet Backend** locally on your machine.

---

## 📋 Prerequisites
Ensure you have the following installed:
* **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
* **Python**: 3.9 to 3.13 ([Download Python](https://www.python.org/))
* **Git**: ([Download Git](https://git-scm.com/))

---

## 🏃 Quick Start (2-Step Local Execution)

To run the complete full-stack system, you need **two terminal windows**:

### 1️⃣ Terminal 1: Start the Backend (FastAPI + Prophet Engine)

From the project root directory:

```bash
cd backend
pip install -r requirements.txt
python main.py
```

* The Python server will start on: **`http://localhost:8000`**
* You will see:
  ```text
  INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
  INFO:     Started reloader process
  INFO:     Application startup complete.
  ```
* **Verify Backend is Running:**  
  Open [http://localhost:8000/](http://localhost:8000/) in your browser. You will see the Apple-style status page showing:  
  `● ArthaX AI Engine is Live`.

---

### 2️⃣ Terminal 2: Start the Frontend (Apple Cupertino React UI)

Open a **new, separate terminal** in the project root:

```bash
cd frontend
npm install
npm run dev
```

* The Vite server will launch at: **`http://localhost:5173/`**
* Open **`http://localhost:5173/`** in your browser.

---

## 🔍 How to Verify Full Live Connectivity

Once both the backend and frontend are running:

1. Open `http://localhost:5173/` in your browser.
2. Check the **top-right pill in the navigation bar**:
   * 🟢 **`● AI Engine Connected`** (Green dot)  
     **100% Live Mode.** Every company you search, historical chart you view, and multi-year projection you generate runs live through Yahoo Finance and Meta Prophet on your machine.
   * 🔵 **`● Local AI Engine`** (Blue dot)  
     **Offline Resilience Mode.** The frontend is using built-in simulated market data because Terminal 1 (the backend) has not been started yet.

---

## 🛠️ Testing Backend Endpoints Directly

You can test and inspect the backend directly via your browser:

* **Interactive Swagger API Documentation:**  
  [http://localhost:8000/docs](http://localhost:8000/docs)
* **Backend Health Check:**  
  [http://localhost:8000/api/health](http://localhost:8000/api/health)
* **Search Auto-suggestion:**  
  [http://localhost:8000/api/search?q=Tesla](http://localhost:8000/api/search?q=Tesla)
* **Live Stock Quotes & Historical Candles:**  
  [http://localhost:8000/api/stock/AAPL?range=1y](http://localhost:8000/api/stock/AAPL?range=1y)

---

## ⚡ Optional: 1-Click Startup for Windows

If you want to start both the backend and frontend with a single click, you can run `run_local.bat` from your file explorer or terminal:

```cmd
run_local.bat
```
*(This automatically opens two terminal windows for you and starts both services).*

---

## 🛑 Troubleshooting

### 1. `Port 8000 is already in use`
If port 8000 is occupied, you can specify a different port in `backend/main.py` or kill the existing process:
```powershell
# Windows PowerShell:
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```

### 2. `Port 5173 is in use`
Vite will automatically offer to use port 5174. If so, update `API_BASE` or launch on 5173:
```powershell
# Windows PowerShell:
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

### 3. Prophet Installation on Windows
If `pip install prophet` prompts for C++ compilers, ensure you have the Microsoft C++ Build Tools or run:
```bash
pip install prophet --only-binary :all:
```
