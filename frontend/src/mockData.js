// Authentic mock datasets with smooth curves for instant demonstration and offline resilience

export const POPULAR_TICKERS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", type: "EQUITY" },
  { symbol: "BTC-USD", name: "Bitcoin USD", exchange: "CCC", type: "CRYPTOCURRENCY" }
];

export const MOCK_STOCKS = {
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    latestPrice: 236.48,
    inrPrice: 19888.00,
    usdInrRate: 84.10,
    change: +3.72,
    changePercent: +1.60,
    fiftyTwoWeekHigh: 242.00,
    fiftyTwoWeekLow: 164.08,
    marketCap: "3.61T",
    volume: "52.4M",
    peRatio: 35.8,
    sentiment: "Bullish",
    growthPercent: 38.45,
    cagr: 17.65,
    projectedPrice: 327.40,
    inrProjected: 27534.34,
    years: 2,
    history: generateHistoricalCandles(236.48, 180, 0.012),
    timeline: generateForecastTimeline(236.48, 2, 0.1765)
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    currency: "USD",
    latestPrice: 134.80,
    inrPrice: 11336.68,
    usdInrRate: 84.10,
    change: +5.12,
    changePercent: +3.95,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 39.23,
    marketCap: "3.31T",
    volume: "118.2M",
    peRatio: 54.2,
    sentiment: "Strong Bullish",
    growthPercent: 62.10,
    cagr: 27.32,
    projectedPrice: 218.51,
    inrProjected: 18376.69,
    years: 2,
    history: generateHistoricalCandles(134.80, 180, 0.024),
    timeline: generateForecastTimeline(134.80, 2, 0.2732)
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    latestPrice: 221.34,
    inrPrice: 18614.69,
    usdInrRate: 84.10,
    change: -2.45,
    changePercent: -1.09,
    fiftyTwoWeekHigh: 271.00,
    fiftyTwoWeekLow: 138.80,
    marketCap: "705.8B",
    volume: "68.9M",
    peRatio: 62.1,
    sentiment: "Neutral / Moderate",
    growthPercent: 24.15,
    cagr: 11.42,
    projectedPrice: 274.80,
    inrProjected: 23110.68,
    years: 2,
    history: generateHistoricalCandles(221.34, 180, 0.028),
    timeline: generateForecastTimeline(221.34, 2, 0.1142)
  },
  "RELIANCE.NS": {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries Ltd",
    exchange: "NSE",
    currency: "INR",
    latestPrice: 2740.50,
    inrPrice: 2740.50,
    usdInrRate: 84.10,
    change: +18.20,
    changePercent: +0.67,
    fiftyTwoWeekHigh: 3217.90,
    fiftyTwoWeekLow: 2220.30,
    marketCap: "₹18.54T",
    volume: "6.8M",
    peRatio: 26.4,
    sentiment: "Bullish",
    growthPercent: 28.50,
    cagr: 13.36,
    projectedPrice: 3521.54,
    inrProjected: 3521.54,
    years: 2,
    history: generateHistoricalCandles(2740.50, 180, 0.011),
    timeline: generateForecastTimeline(2740.50, 2, 0.1336)
  }
};

function generateHistoricalCandles(latest, days, volatility) {
  const candles = [];
  let current = latest * (1 - days * 0.0008);
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const noise = (Math.sin(i / 10) * 0.6 + (Math.random() - 0.48)) * volatility * current;
    current = Math.max(10, current + noise);

    const high = current * (1 + Math.random() * 0.012);
    const low = current * (1 - Math.random() * 0.012);
    const open = low + Math.random() * (high - low);

    candles.push({
      date: d.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(current.toFixed(2)),
      volume: Math.floor(20000000 + Math.random() * 30000000)
    });
  }

  // Ensure last candle is exact
  if (candles.length > 0) {
    candles[candles.length - 1].close = latest;
  }
  return candles;
}

export function generateForecastTimeline(basePrice, years, expectedCagr) {
  const points = [];
  const now = new Date();
  const cagrDecimal = (expectedCagr > 1 ? expectedCagr / 100 : expectedCagr) || 0.15;

  // Exact anchor at today (Current Price)
  points.push({
    date: now.toISOString().split("T")[0],
    actual: basePrice,
    predicted: basePrice,
    upper: basePrice,
    lower: basePrice
  });

  // Future Prophet forecast trajectory
  const futureDays = years * 365;

  for (let i = 7; i <= futureDays; i += 7) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const progressYears = i / 365;
    // Compound growth with annual seasonality curve
    const seasonalWave = Math.sin((progressYears * 2 * Math.PI)) * (basePrice * 0.035);
    const futurePrice = basePrice * Math.pow(1 + cagrDecimal, progressYears) + seasonalWave;

    // Expanding confidence corridor
    const uncertainty = basePrice * (0.05 + 0.10 * Math.sqrt(progressYears));

    points.push({
      date: d.toISOString().split("T")[0],
      actual: null,
      predicted: parseFloat(futurePrice.toFixed(2)),
      upper: parseFloat((futurePrice + uncertainty).toFixed(2)),
      lower: parseFloat(Math.max(0, futurePrice - uncertainty).toFixed(2))
    });
  }

  return points;
}
