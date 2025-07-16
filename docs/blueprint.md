# **App Name**: Crypto Insights AI

## Core Features:

- Pair Selection: Cryptocurrency pair selection with options for ETH/USDT, BTC/USDT, and others.
- Timeframe Selection: Timeframe selector for analysis intervals such as 15m, 1h, 4h, and 1d.
- Bybit API Integration: Connect to Bybit's REST API to fetch real-time kline data based on the selected pair and timeframe using API Key aXHNPUtB5PGdkFrh8Q and API Secret GPGiwJ1folJ9AJrq7YFcP7EYAHuza7EtXvIH.
- Candlestick Chart Display: Display interactive candlestick charts using react-plotly.js or lightweight-charts.
- AI Analysis Integration: Use an internal API route within Next.js to send technical data (price, RSI, MACD, EMA) to Gemini AI for analysis.
- AI-Powered Technical Analysis: Gemini AI analyzes the cryptocurrency pair's technical indicators in Vietnamese and generates insights, including overall market assessment, indicator explanations, buy/sell signals, and suggested entry, stop-loss, and take-profit levels. Gemini will use its tool to make sure that those indicators align with current price action.
- Detailed Analysis Display: Display detailed technical analysis, trend predictions, and entry/stop-loss/take-profit recommendations below the candlestick chart.

## Style Guidelines:

- Primary color: Saturated cyan (#42C2FF) for a modern and tech-focused feel.
- Background color: Light gray (#F0F0F0) to ensure readability and a clean interface.
- Accent color: Soft lime green (#DFFF00) for highlights and action buttons.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, 'Inter' (sans-serif) for body text.
- Use minimalist icons for pair selection and timeframe options.
- Implement a clean, responsive layout optimized for both desktop and mobile devices.
- Subtle animations to transition between different cryptocurrency pairs or timeframes.