import gradio as gr
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from prophet import Prophet
from datetime import date
import warnings
import requests
import re

# Suppress prophet non-critical warnings
warnings.filterwarnings("ignore")

# Define the start date for historical data gathering
START_DATE = "2015-01-01"
TODAY = date.today().strftime("%Y-%m-%d")

def search_company_ticker(query):
    """Hits the Yahoo Finance Search API to auto-suggest tickers based on company name."""
    if not query or len(query) < 2:
        return gr.update(choices=[], value=None)
    
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code != 200:
            return gr.update(choices=["❌ API Error / No matches"], value=None)
            
        data = res.json()
        choices = []
        valid_types = ['EQUITY', 'ETF', 'MUTUALFUND', 'CRYPTOCURRENCY', 'CURRENCY']
        
        for quote in data.get('quotes', []):
            if quote.get('quoteType') in valid_types:
                symbol = quote.get('symbol')
                name = quote.get('shortname', quote.get('longname', symbol))
                if symbol:
                    choices.append(f"{name} ({symbol})")
                    
        # Remove duplicates while preserving order
        choices = list(dict.fromkeys(choices))
        
        if not choices:
            return gr.update(choices=["❌ No matching companies found"], value=None)
            
        return gr.update(choices=choices, value=choices[0])
    except Exception as e:
        return gr.update(choices=["❌ Search service unavailable"], value=None)

def fetch_stock_data(ticker):
    """Fetches historical stock data from Yahoo Finance."""
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(start=START_DATE, end=TODAY)
        if df.empty:
            return None, "Error: No data found. Please check the ticker symbol."
        
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        df.reset_index(inplace=True)
        
        if 'Date' not in df.columns and 'Datetime' in df.columns:
            df.rename(columns={'Datetime': 'Date'}, inplace=True)
        
        df.ffill(inplace=True) 
        df.dropna(subset=['Close'], inplace=True)
        
        if df['Date'].dt.tz is not None:
            df['Date'] = df['Date'].dt.tz_localize(None)
            
        return df, "Success"
    except Exception as e:
        return None, f"Error fetching data: {str(e)}"

def plot_historical_data(df):
    """Creates a professional, responsive Plotly candlestick chart for historical data."""
    fig = go.Figure()
    fig.add_trace(go.Candlestick(
        x=df['Date'],
        open=df['Open'],
        high=df['High'],
        low=df['Low'],
        close=df['Close'],
        name='Market Data',
        increasing_line_color='#26a69a', 
        decreasing_line_color='#ef5350'  
    ))
    
    fig.update_layout(
        yaxis_title='Stock Price',
        xaxis_title='Date',
        xaxis=dict(
            range=[df['Date'].min(), df['Date'].max()], 
            rangeselector=dict(
                buttons=list([
                    dict(count=1, label="1m", step="month", stepmode="backward"),
                    dict(count=6, label="6m", step="month", stepmode="backward"),
                    dict(count=1, label="1y", step="year", stepmode="backward"),
                    dict(count=5, label="5y", step="year", stepmode="backward"),
                    dict(step="all", label="MAX")
                ]),
                bgcolor="#1e293b",
                activecolor="#3b82f6",
                font=dict(color="white", size=10), 
                y=-0.3,         # Placed securely below the X-axis title to prevent overlap
                x=0.5,          # Centered for mobile responsiveness
                xanchor="center",
                yanchor="top"
            ),
            type="date",
            showgrid=True,
            gridcolor='#334155'
        ),
        yaxis=dict(showgrid=True, gridcolor='#334155', zeroline=False),
        xaxis_rangeslider_visible=False,
        template="plotly_dark",
        plot_bgcolor='#0f172a',
        paper_bgcolor='#0f172a',
        margin=dict(l=40, r=15, t=50, b=90), # Added top gap (t=50) and bottom gap for X-axis text (b=90)
        height=380,           
        autosize=True,
        dragmode='pan',
        hovermode='x unified', 
        showlegend=False      
    )
    return fig

def train_and_predict(df, years_to_predict):
    """Trains the Prophet model and generates future price projections."""
    df_train = df[['Date', 'Close']].copy()
    df_train = df_train.rename(columns={"Date": "ds", "Close": "y"})
    
    m = Prophet(daily_seasonality=False, yearly_seasonality=True)
    m.fit(df_train)
    
    period = years_to_predict * 365
    future = m.make_future_dataframe(periods=period)
    future = future[future['ds'].dt.dayofweek < 5]
    
    forecast = m.predict(future)
    
    fig = go.Figure()
    
    # Actual Data
    fig.add_trace(go.Scatter(
        x=df_train['ds'], y=df_train['y'], 
        name="Actual Price", mode='lines', line=dict(color='#38bdf8', width=2) 
    ))
    
    # Predicted Data
    fig.add_trace(go.Scatter(
        x=forecast['ds'], y=forecast['yhat'], 
        name="Predicted Trend", mode='lines', line=dict(color='#fbbf24', width=2) 
    ))
    
    # Confidence Intervals
    fig.add_trace(go.Scatter(
        x=forecast['ds'], y=forecast['yhat_upper'], 
        mode='lines', line_color='rgba(0,0,0,0)', showlegend=False, name='Upper Bound',
        hoverinfo="skip"
    ))
    fig.add_trace(go.Scatter(
        x=forecast['ds'], y=forecast['yhat_lower'], 
        mode='lines', fill='tonexty', fillcolor='rgba(251, 191, 36, 0.15)', 
        line_color='rgba(0,0,0,0)', name="Confidence Interval",
        hoverinfo="skip"
    ))
    
    fig.update_layout(
        yaxis_title='Stock Price',
        xaxis_title='Date',
        xaxis=dict(showgrid=True, gridcolor='#334155'),
        yaxis=dict(showgrid=True, gridcolor='#334155', zeroline=False),
        template="plotly_dark",
        plot_bgcolor='#0f172a', 
        paper_bgcolor='#0f172a',
        hovermode="x unified",
        margin=dict(l=40, r=15, t=50, b=90), # Added top gap (t=50) and bottom gap for X-axis text (b=90)
        height=380,           
        autosize=True,
        legend=dict(
            orientation="h", 
            yanchor="top", 
            y=-0.3,           # Placed securely below the X-axis title
            xanchor="center", 
            x=0.5,           
            font=dict(size=11)
        )
    )
    
    return fig, forecast

def get_empty_fig():
    """Returns an empty figure to gracefully handle startup/errors."""
    fig = go.Figure()
    fig.update_layout(
        template="plotly_dark", 
        plot_bgcolor='#0f172a', 
        paper_bgcolor='#0f172a',
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        height=380,
        margin=dict(l=40, r=15, t=50, b=90)
    )
    return fig

def process_pipeline(selected_string, years):
    """Main pipeline triggered by the Gradio 'Analyze' button."""
    if not selected_string or "❌" in selected_string:
        empty = get_empty_fig()
        return empty, empty, empty, "⚠️ Please search and select a valid company."
        
    match = re.search(r'\((.*?)\)$', selected_string)
    ticker = match.group(1) if match else selected_string.strip()
        
    df, status = fetch_stock_data(ticker)
    
    if df is None:
        empty = get_empty_fig()
        return empty, empty, empty, status
        
    hist_plot = plot_historical_data(df)
    pred_plot, forecast_df = train_and_predict(df, years)
    
    latest_price = df['Close'].iloc[-1]
    future_price = forecast_df['yhat'].iloc[-1]
    growth = ((future_price - latest_price) / latest_price) * 100
    
    try:
        inr_data = yf.Ticker("INR=X").history(period="1d")
        if isinstance(inr_data.columns, pd.MultiIndex):
            inr_data.columns = inr_data.columns.get_level_values(0)
        usd_inr_rate = float(inr_data['Close'].iloc[-1])
    except Exception:
        usd_inr_rate = 83.50 
        
    try:
        currency = yf.Ticker(ticker).fast_info.get('currency', 'USD')
    except Exception:
        currency = 'USD'
        
    if currency == 'INR':
        latest_display = f"₹{latest_price:.2f}"
        future_display = f"₹{future_price:.2f}"
        exchange_note = ""
    else:
        latest_inr = latest_price * usd_inr_rate
        future_inr = future_price * usd_inr_rate
        curr_symbol = "$" if currency == "USD" else f"{currency} "
        latest_display = f"{curr_symbol}{latest_price:.2f} (₹{latest_inr:.2f})"
        future_display = f"{curr_symbol}{future_price:.2f} (₹{future_inr:.2f})"
        exchange_note = f"\n- *Converted at live rate: 1 {currency} = ₹{usd_inr_rate:.2f}*"
    
    arrow = "📈" if growth > 0 else "📉"
    
    summary = (
        f"### ✅ Analysis Complete for **{ticker.upper()}**\n"
        f"- **Latest Close Price:** {latest_display}\n"
        f"- **Projected Price in {years} years:** {future_display}\n"
        f"- **Expected Growth/Decline:** {arrow} {growth:.2f}%{exchange_note}"
    )
    
    return hist_plot, pred_plot, pred_plot, summary


def switch_graph_view(toggle_value, hist_fig, pred_fig):
    """Dynamically swaps the graph inside the single viewer container."""
    if toggle_value == "📊 Future AI Projection":
        return pred_fig
    return hist_fig


# ==============================================================================
# UI DESIGN USING GRADIO BLOCKS
# ==============================================================================
custom_theme = gr.themes.Soft(
    primary_hue="indigo",
    secondary_hue="cyan",
    neutral_hue="slate",
    font=[gr.themes.GoogleFont("Inter"), "sans-serif"]
)

with gr.Blocks(theme=custom_theme, title="ArthaX Stock Predictor") as demo:
    
    # Invisible state variables to store generated figures without rendering them
    stored_hist_plot = gr.State(get_empty_fig())
    stored_pred_plot = gr.State(get_empty_fig())
    
    # Header Section
    with gr.Column(elem_id="header"):
        gr.Markdown(
            """
            <div style="text-align: center; max-width: 800px; margin: 0 auto; padding: 10px;">
                <h1>ArthaX: AI-Powered Global Market Analytics & Forecasting Dashboard</h1>
                <p>Powered by AstraGenX. Search for any globally listed company by name or ticker to instantly visualize its historical performance and unlock data-driven forecasts for future market trends.</p>
            </div>
            """
        )
    
    with gr.Row():
        # Controls Panel
        with gr.Column(scale=1, variant="panel"):
            gr.Markdown("### 🔍 Search & Setup")
            
            company_search = gr.Textbox(
                label="Step 1: Search Company Name", 
                placeholder="Type name here (e.g., Apple, Tesla, Reliance)...",
                info="Type 2+ characters to trigger auto-search."
            )
            
            ticker_dropdown = gr.Dropdown(
                label="Step 2: Select Exact Ticker", 
                choices=[], 
                interactive=True,
                info="Select the verified ticker from the dropdown."
            )
            
            company_search.change(
                fn=search_company_ticker,
                inputs=company_search,
                outputs=ticker_dropdown
            )

            with gr.Accordion("⚙️ Projection Settings", open=False):
                years_slider = gr.Slider(
                    minimum=1, maximum=5, step=1, value=2, 
                    label="Years to Predict into the Future"
                )
            
            analyze_btn = gr.Button("Run AI Analysis", variant="primary", size="lg")
            output_status = gr.Markdown()
            
        # Visualization Panel
        with gr.Column(scale=2):
            # Using a Radio Toggle completely fixes the mobile tab issue
            view_toggle = gr.Radio(
                choices=["📊 Future AI Projection", "🕯️ Historical Data"],
                value="📊 Future AI Projection",
                label="Select Graph View",
                interactive=True
            )
            
            # A single unified display plot solves resizing issues
            display_plot = gr.Plot(label="Market Chart Data", value=get_empty_fig())

    # 1. Action: Process data, save to state, and update screen with Prediction Plot by default
    analyze_btn.click(
        fn=process_pipeline,
        inputs=[ticker_dropdown, years_slider],
        outputs=[stored_hist_plot, stored_pred_plot, display_plot, output_status]
    ).then(
        # Reset toggle to default view so it syncs with display
        fn=lambda: "📊 Future AI Projection", 
        outputs=view_toggle
    )

    # 2. Action: Swiftly swap the graph when user clicks the toggle
    view_toggle.change(
        fn=switch_graph_view,
        inputs=[view_toggle, stored_hist_plot, stored_pred_plot],
        outputs=display_plot
    )

# Launch the app
if __name__ == "__main__":
    demo.launch(debug=True, share=True)