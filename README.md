<h1 align="left">📈 ArthaX: AI-Powered Market Analytics</h1>
<h3 align="left">Global Market Forecasting & Financial Intelligence Dashboard</h3>

<p align="left">
  <a href="https://huggingface.co/spaces/Bangadhipati/ArthaX" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo_on_Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=000" alt="Hugging Face Demo"/>
  </a>
</p>

<img width="2526" height="1462" alt="image" src="https://github.com/user-attachments/assets/20138def-8ac6-479e-9168-0fd7fead5a2f" />

---

### 👾 System Overview
**ArthaX** is an AI-driven financial intelligence platform built to decode global market movements and provide data-driven price projections. Originally developed as part of the AstraGenX ecosystem, this application allows users to search for any globally listed company, visualize its historical performance, and unlock future market trend forecasts powered by advanced time-series modeling.

---

### 🚀 Key Features
- 🔍 **Smart Ticker Search:** Auto-suggests verified company tickers dynamically by querying the Yahoo Finance API.
- 🕯️ **Interactive Market Data:** Renders professional, hardware-accelerated Plotly candlestick charts with intuitive time-range selectors (1m, 6m, 1y, 5y, MAX).
- 🤖 **AI Price Projection:** Utilizes Meta's `prophet` model to forecast stock trends 1 to 5 years into the future, rendering predictive trajectories and confidence intervals.
- 💱 **Live Currency Conversion:** Automatically detects the stock's native currency and calculates real-time exchange rates (e.g., live USD to INR conversion) using Yahoo Finance data.
- 🌓 **Dynamic UI:** Features a sleek, responsive, dark-themed interface built with Gradio Blocks, allowing seamless toggling between historical data and future AI projections without reloading.

---

### 💻 Tech Stack & Arsenal

**Core Framework & Environments:**<br>
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Gradio](https://img.shields.io/badge/Gradio-FF7C00?style=for-the-badge&logo=gradio&logoColor=white) ![Hugging Face](https://img.shields.io/badge/Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=000) ![Google Colab](https://img.shields.io/badge/Google_Colab-F9AB00?style=for-the-badge&logo=googlecolab&logoColor=white) 

**Data Science & Machine Learning:**<br>
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![Plotly](https://img.shields.io/badge/Plotly-3F4F75?style=for-the-badge&logo=plotly&logoColor=white) ![Prophet](https://img.shields.io/badge/Prophet-0467DF?style=for-the-badge&logo=meta&logoColor=white)

**APIs & Data Ingestion:**<br>
![yfinance](https://img.shields.io/badge/yfinance-412991?style=for-the-badge&logo=yahoofinance&logoColor=white) ![Yahoo Finance API](https://img.shields.io/badge/Yahoo_Finance_API-412991?style=for-the-badge&logo=yahoofinance&logoColor=white) ![Requests](https://img.shields.io/badge/Requests-3776AB?style=for-the-badge&logo=python&logoColor=white)

---

### ⚙️ Getting Started (Local Development)

To run ArthaX locally on your machine, ensure you have Python 3.8+ installed.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Bangadhipati/ArthaX.git](https://github.com/Bangadhipati/ArthaX.git)
   cd ArthaX

2. **Install required dependencies:**
    ```bash
    pip install gradio yfinance pandas plotly prophet requests

3. **Launch the application:**

    ```bash
    python app.py


*The application will start a local Gradio server, usually accessible at `http://127.0.0.1:7860/`.*

---

> **🚀 Live Deployment:** Experience the live application on Hugging Face Spaces: [ArthaX Web App](https://huggingface.co/spaces/Bangadhipati/ArthaX)
