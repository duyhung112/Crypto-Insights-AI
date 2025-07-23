
"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import { initGenkit } from "@/ai/genkit";
import type { AnalyzeCryptoPairInput, KlineData, NewsAnalysisInput, AnalyzeCryptoPairOutput, NewsArticle } from "@/lib/types";
import { RSI, MACD, EMA } from "technicalindicators";
import { sendDiscordNotification, getNewsForCrypto } from "@/lib/tools";

export async function getBybitKlineData(pair: string, timeframe: string, limit: number = 200): Promise<KlineData[]> {
    const params = new URLSearchParams({
        symbol: pair,
        interval: timeframe,
        limit: String(limit),
    });
    const url = `/api/bybit/kline?${params.toString()}`;
    
    try {
        const response = await fetch(new URL(url, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'), { cache: 'no-store' });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Bybit API Error: ${errorBody.error || response.statusText}`);
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
        if (error instanceof Error) {
            throw new Error(`Không thể tải dữ liệu từ Bybit: ${error.message}`);
        }
        throw new Error("Không thể tải dữ liệu biểu đồ từ Bybit.");
    }
}

const convertTimeframeToNami = (timeframe: string): string => {
    const mapping: { [key: string]: string } = {
        '15': '15m',
        '60': '1h',
        '240': '4h',
        'D': '1D',
        'W': '1W',
    };
    return mapping[timeframe] || '1h'; 
}

export async function getNamiKlineData(pair: string, timeframe: string, limit: number = 500): Promise<KlineData[]> {
    const resolution = convertTimeframeToNami(timeframe);
    const now = Math.floor(Date.now() / 1000);
    // Fetch a reasonable amount of data based on timeframe
    const from = now - (60 * 60 * 24 * 90); // 90 days of data
    
    const params = new URLSearchParams({
        symbol: pair.replace('/', ''), // Nami uses format like 'BTCVNDC'
        resolution: resolution,
        from: String(from),
        to: String(now),
    });

    const url = `/api/nami/history?${params.toString()}`;

    try {
        const response = await fetch(new URL(url, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'), { cache: 'no-store' });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Nami API Error: ${response.statusText} - ${errorBody}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
           // Handle cases where Nami returns an error object, e.g., { s: 'error', errmsg: '...' }
           if (data.s && data.s !== 'ok') {
               throw new Error(`Nami API returned an error: ${data.errmsg || 'Unknown error'}`);
           }
           // Handle other unexpected non-array responses
           throw new Error(`Nami API returned an unexpected data format.`);
        }

        const klineData: KlineData[] = data.map((d: number[]) => ({
            time: d[0] * 1000, // Convert seconds to milliseconds
            open: d[1],
            high: d[2],
            low: d[3],
            close: d[4],
        }));
        
        return klineData;

    } catch (error) {
        console.error("Failed to fetch kline data from Nami:", error);
        if (error instanceof Error) {
            throw new Error(`Không thể tải dữ liệu từ Nami: ${error.message}`);
        }
        throw new Error("Không thể tải dữ liệu biểu đồ từ Nami.");
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

export async function getAnalysis(pair: string, timeframe: string, mode: 'swing' | 'scalping', exchange: 'bybit' | 'nami', discordWebhookUrl?: string, geminiApiKey?: string) {
  try {
    if (!geminiApiKey) {
      throw new Error("Vui lòng cung cấp Gemini API Key trong phần Cài đặt để sử dụng tính năng phân tích.");
    }
    
    const userAi = initGenkit(geminiApiKey);

    let klineData: KlineData[];
    const exchangeName = exchange.toUpperCase();

    if (exchange === 'bybit') {
        klineData = await getBybitKlineData(pair, timeframe, 200);
    } else if (exchange === 'nami') {
        klineData = await getNamiKlineData(pair, timeframe, 500);
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
    
    const cryptoSymbol = pair.replace(/USDT$/, '').replace(/_USDT$/, '').replace(/_VNDC$/, '').replace(/\/.*/, '');
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

    
