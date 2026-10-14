<h1 align="left">📈 ArthaX (v1.0 Prototype)</h1>
<h3 align="left">Original Hugging Face & Gradio Research Prototype</h3>

<p align="left">
  <a href="https://huggingface.co/spaces/Bangadhipati/ArthaX" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo_on_Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=000" alt="Hugging Face Demo"/>
  </a>
</p>

> [!NOTE]
> This folder preserves the initial proof-of-concept prototype of **ArthaX** built with Python and Gradio Blocks. For the production-grade, enterprise full-stack version featuring FastAPI, React 18, Vite, and high-performance interactive vector charts, please refer to the root [README.md](../README.md).

---

### 👾 System Overview
**ArthaX (v1.0)** is an AI-driven financial intelligence prototype built to decode global market movements and provide data-driven price projections. Originally developed as part of the AstraGenX ecosystem, this application allows users to search for any globally listed company, visualize its historical performance, and unlock future market trend forecasts powered by advanced time-series modeling.

---

### 🚀 Key Features (v1.0 Prototype)
- 🔍 **Smart Ticker Search:** Auto-suggests verified company tickers dynamically by querying the Yahoo Finance API.
- 🕯️ **Interactive Market Data:** Renders Plotly candlestick charts with time-range selectors (1m, 6m, 1y, 5y, MAX).
- 🤖 **AI Price Projection:** Utilizes Meta's `prophet` model to forecast stock trends 1 to 5 years into the future.
- 💱 **Live Currency Conversion:** Automatically detects the stock's native currency and calculates real-time exchange rates (USD to INR conversion) using Yahoo Finance data.
- 🌓 **Gradio UI:** Features a dark-themed single-page interface built with Gradio Blocks.

---

### 💻 Tech Stack (Prototype)
- **Framework:** Python, Gradio Blocks
- **Data Science & ML:** Pandas, Plotly, Meta Prophet
- **Data Ingestion:** yfinance, Requests

---

### ⚙️ Running the Prototype Locally
To run this original prototype locally:

```bash
cd Old_Prototype
pip install -r requirements.txt
python app.py
```

*The application will launch a local Gradio server at `http://127.0.0.1:7860/`.*
