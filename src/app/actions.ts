
"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import { initGenkit } from "@/ai/genkit";
import type { AnalyzeCryptoPairInput, KlineData, NewsAnalysisInput, AnalyzeCryptoPairOutput, NewsArticle } from "@/lib/types";
import { RSI, MACD, EMA } from "technicalindicators";
import { sendDiscordNotification, getNewsForCrypto } from "@/lib/tools";

export async function getBybitKlineData(pair: string, timeframe: string, limit: number = 200): Promise<KlineData[]> {
    const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${pair}&interval=${timeframe}&limit=${limit}`;
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Bybit API Error: ${response.statusText} - ${errorBody}`);
        }
        const data = await response.json();
        if (data.retCode !== 0) {
            throw new Error(`Bybit API Error: ${data.retMsg}`);
        }

        const klineData: KlineData[] = data.result.list
            .map((d: string[]) => ({
                time: parseInt(d[0]),
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
            }))
            .reverse(); // Bybit returns newest first, so reverse

        return klineData;
    } catch (error) {
        console.error("Failed to fetch kline data from Bybit:", error);
        throw new Error("Không thể tải dữ liệu biểu đồ từ Bybit.");
    }
}

const ONUS_API_URL = "https://spot-markets-dev.goonus.io/candlesticks";

const convertTimeframeToOnus = (timeframe: string) => {
    // Bybit: 1, 3, 5, 15, 30, 60, 120, 240, 360, 720, D, M, W
    // ONUS: 1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d, 1w, 1M
    const mapping: { [key: string]: string } = {
        '15': '15m',
        '60': '1h',
        '240': '4h',
        'D': '1d',
        'W': '1w',
        'M': '1M'
    };
    return mapping[timeframe] || '1h'; // Default to 1 hour
}

export async function getOnusKlineData(pair: string, timeframe: string, limit: number = 500): Promise<KlineData[]> {
    const onusSymbol = pair; 
    const onusTimeframe = convertTimeframeToOnus(timeframe);
    
    const to = Math.floor(Date.now() / 1000) * 1000;
    let from: number;

    const getFromTimestamp = (days: number) => {
      return to - (days * 24 * 60 * 60 * 1000);
    }
    
    // Define a reasonable lookback period in days to avoid overly large requests
    switch(onusTimeframe) {
        case '15m': from = getFromTimestamp(7); break; // 7 days of 15m data
        case '1h': from = getFromTimestamp(30); break; // 30 days of 1h data
        case '4h': from = getFromTimestamp(90); break; // 90 days of 4h data
        case '1d': from = getFromTimestamp(365); break; // 1 year of daily data
        case '1w': from = getFromTimestamp(365 * 2); break; // 2 years of weekly data
        case '1M': from = getFromTimestamp(365 * 5); break; // 5 years of monthly data
        default: from = getFromTimestamp(90); 
    }

    const url = `${ONUS_API_URL}?symbol_name=${onusSymbol}&interval=${onusTimeframe}&from=${from}&to=${to}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`ONUS API Error: ${response.statusText} - ${errorBody}`);
        }
        const data = await response.json();
         if (!Array.isArray(data)) {
            console.error("ONUS API did not return an array:", data);
            throw new Error(`API của ONUS không trả về dữ liệu hợp lệ cho cặp ${onusSymbol}. Vui lòng kiểm tra lại cặp tiền.`);
        }

        // ONUS returns data in a different structure with string values
        const klineData: KlineData[] = data.map((d: any) => ({
            time: parseInt(d.t, 10),
            open: parseFloat(d.o),
            high: parseFloat(d.h),
            low: parseFloat(d.l),
            close: parseFloat(d.c),
        }));

        return klineData;
    } catch (error) {
        console.error("Failed to fetch kline data from ONUS:", error);
        if (error instanceof Error) {
            throw new Error(`Không thể tải dữ liệu từ ONUS: ${error.message}`);
        }
        throw new Error("Không thể tải dữ liệu biểu đồ từ ONUS.");
    }
}


async function handleDiscordNotification(message: string, webhookUrl: string) {
    if (!webhookUrl) return;
    try {
        await sendDiscordNotification({ message, webhookUrl });
    } catch (error) {
        console.error("Failed to send Discord notification from action:", error);
    }
}

export async function getAnalysis(pair: string, timeframe: string, mode: 'swing' | 'scalping', exchange: 'bybit' | 'onus', discordWebhookUrl?: string, geminiApiKey?: string) {
  try {
    if (!geminiApiKey) {
      throw new Error("Vui lòng cung cấp Gemini API Key trong phần Cài đặt để sử dụng tính năng phân tích.");
    }
    
    const userAi = initGenkit(geminiApiKey);

    let klineData: KlineData[];
    const exchangeName = exchange.toUpperCase();

    if (exchange === 'bybit') {
        klineData = await getBybitKlineData(pair, timeframe, 200);
    } else if (exchange === 'onus') {
        klineData = await getOnusKlineData(pair, timeframe, 500);
    } else {
        throw new Error("Sàn giao dịch không được hỗ trợ.");
    }

    if (klineData.length < 50) {
      throw new Error("Không đủ dữ liệu lịch sử để phân tích cặp tiền này.");
    }

    const closePrices = klineData.map((k) => k.close);
    const latestPrice = closePrices[closePrices.length - 1];

    const rsiResult = RSI.calculate({ values: closePrices, period: 14 });
    const macdResult = MACD.calculate({ values: closePrices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMA: false });
    const ema9Result = EMA.calculate({ values: closePrices, period: 9 });
    const ema21Result = EMA.calculate({ values: closePrices, period: 21 });

    const latestRsi = rsiResult[rsiResult.length - 1];
    const latestMacdLine = macdResult[macdResult.length - 1]?.MACD;
    const latestMacdSignal = macdResult[macdResult.length - 1]?.signal;
    const latestEma9 = ema9Result[ema9Result.length - 1];
    const latestEma21 = ema21Result[ema21Result.length - 1];
    
    if (latestRsi === undefined || latestMacdLine === undefined || latestMacdSignal === undefined || latestEma9 === undefined || latestEma21 === undefined) {
      throw new Error("Không thể tính toán các chỉ báo kỹ thuật. Cần thêm dữ liệu.");
    }

    const aiInput: AnalyzeCryptoPairInput = {
      pair,
      timeframe,
      price: latestPrice,
      mode,
      rsi: latestRsi,
      macd: { line: latestMacdLine, signal: latestMacdSignal },
      ema: { ema9: latestEma9, ema21: latestEma21 },
      high: klineData[klineData.length - 1].high,
      low: klineData[klineData.length - 1].low,
    };
    
    const cryptoSymbol = pair.replace(/USDT$/, '').replace(/_USDT$/, '').replace(/_VNDC$/, '');
    const newsArticles = await getNewsForCrypto({ cryptoSymbol });
    const newsInput: NewsAnalysisInput = { cryptoSymbol, articles: newsArticles };

    const [aiAnalysisResponse, newsAnalysisResponse] = await Promise.all([
        analyzeCryptoPair(aiInput, userAi),
        analyzeNewsSentiment(newsInput, userAi),
    ]);
    
    const tradingSignalsResponse = { signals: aiAnalysisResponse.signals };

    if (aiAnalysisResponse && discordWebhookUrl) {
        const signal = aiAnalysisResponse.buySellSignal.toUpperCase();
        if (signal.includes('MUA') || signal.includes('BUY') || signal.includes('BÁN') || signal.includes('SELL')) {
            const message = `**Tín hiệu Mới: ${aiAnalysisResponse.buySellSignal.toUpperCase()} ${aiInput.pair} (${exchangeName})**
Chế độ: ${aiInput.mode} | Khung: ${aiInput.timeframe}
Giá hiện tại: ${aiInput.price}
---
**Kế hoạch Giao dịch Đề xuất:**
- **Vào lệnh:** ${aiAnalysisResponse.entrySuggestion}
- **Dừng lỗ (SL):** ${aiAnalysisResponse.stopLossSuggestion}
- **Chốt lời (TP):** ${aiAnalysisResponse.takeProfitSuggestion}`;
            await handleDiscordNotification(message, discordWebhookUrl);
        }
    }
    
    return { 
        aiAnalysis: aiAnalysisResponse,
        tradingSignals: tradingSignalsResponse,
        newsAnalysis: newsAnalysisResponse,
     };
  } catch (error) {
    const exchangeName = exchange.toUpperCase();
    if (discordWebhookUrl) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
        const notificationMessage = `**LỖI PHÂN TÍCH (${exchangeName})**
Cặp: ${pair}
Lỗi: \`\`\`${errorMessage}\`\`\``;
        await handleDiscordNotification(notificationMessage, discordWebhookUrl);
    }
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Đã xảy ra lỗi không xác định." };
  }
}


