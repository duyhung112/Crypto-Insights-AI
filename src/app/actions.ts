
"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import { initGenkit } from "@/ai/genkit";
import type { AnalyzeCryptoPairInput, KlineData, NewsAnalysisInput, AnalyzeCryptoPairOutput, NewsArticle, NewsAnalysisOutput, HigherTimeframeData } from "@/lib/types";
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
                volume: parseFloat(d[5]),
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

async function handleDiscordNotification(message: string, webhookUrl: string) {
    if (!webhookUrl) return;
    try {
        await sendDiscordNotification({ message, webhookUrl });
    } catch (error) {
        console.error("Failed to send Discord notification from action:", error);
    }
}

const getHigherTimeframe = (timeframe: string): string | null => {
    const mapping: { [key: string]: string } = {
        '15': '60', // 15m -> 1h
        '60': '240', // 1h -> 4h
        '240': 'D',  // 4h -> 1D
    };
    return mapping[timeframe] || null;
}

export async function getAnalysis(pair: string, timeframe: string, mode: 'swing' | 'scalping', discordWebhookUrl?: string, geminiApiKey?: string) {
  try {
    if (!geminiApiKey) {
      throw new Error("Vui lòng cung cấp Gemini API Key trong phần Cài đặt để sử dụng tính năng phân tích.");
    }
    
    const userAi = initGenkit(geminiApiKey);

    const primaryTimeframe = mode === 'scalping' ? '15' : timeframe;
    const higherTimeframe = getHigherTimeframe(primaryTimeframe);

    // Fetch data for both timeframes, only fetch HTF if it's different and exists
    const promises = [
        getBybitKlineData(pair, primaryTimeframe, 200),
        (higherTimeframe) ? getBybitKlineData(pair, higherTimeframe, 200) : Promise.resolve(null),
        getNewsForCrypto({ cryptoSymbol: pair.replace(/USDT$/, '').replace(/\/.*/, '') })
    ];

    const [primaryKlineData, higherTimeframeKlineData, newsArticles] = await Promise.all(promises);
   
    if (primaryKlineData.length < 50) {
      throw new Error("Không đủ dữ liệu lịch sử để phân tích cặp tiền này.");
    }

    // --- Calculate indicators for primary timeframe ---
    const primaryClosePrices = primaryKlineData.map((k) => k.close);
    const latestPrimaryKline = primaryKlineData[primaryKlineData.length - 1];
    const primaryRsi = RSI.calculate({ values: primaryClosePrices, period: 14 }).pop();
    const primaryMacd = MACD.calculate({ values: primaryClosePrices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMA: false }).pop();
    const primaryEma9 = EMA.calculate({ values: primaryClosePrices, period: 9 }).pop();
    const primaryEma21 = EMA.calculate({ values: primaryClosePrices, period: 21 }).pop();

    if (!primaryRsi || !primaryMacd?.MACD || !primaryMacd?.signal || !primaryEma9 || !primaryEma21) {
         throw new Error("Không thể tính toán các chỉ báo kỹ thuật cho khung thời gian chính.");
    }
    
    // --- Calculate indicators for higher timeframe ---
    let htfData: HigherTimeframeData | undefined = undefined;
    if (higherTimeframe && higherTimeframeKlineData && higherTimeframeKlineData.length > 50) {
        const htfClosePrices = higherTimeframeKlineData.map((k) => k.close);
        const latestHtfKline = higherTimeframeKlineData[higherTimeframeKlineData.length - 1];
        const htfRsi = RSI.calculate({ values: htfClosePrices, period: 14 }).pop();
        const htfMacd = MACD.calculate({ values: htfClosePrices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMA: false }).pop();
        const htfEma9 = EMA.calculate({ values: htfClosePrices, period: 9 }).pop();
        const htfEma21 = EMA.calculate({ values: htfClosePrices, period: 21 }).pop();
        
        if (htfRsi && htfMacd?.MACD && htfMacd?.signal && htfEma9 && htfEma21) {
            htfData = {
                timeframe: higherTimeframe,
                price: latestHtfKline.close,
                rsi: htfRsi,
                macd: { line: htfMacd.MACD, signal: htfMacd.signal },
                ema: { ema9: htfEma9, ema21: htfEma21 },
            };
        }
    }
    
    // --- News Analysis ---
    const cryptoSymbol = pair.replace(/USDT$/, '').replace(/\/.*/, '');
    let newsAnalysisResponse: NewsAnalysisOutput;
    
    if (!newsArticles || newsArticles.length === 0) {
        newsAnalysisResponse = {
            sentiment: 'Neutral',
            summary: 'Không tìm thấy tin tức mới.',
            reasoning: 'Không có dữ liệu tin tức để phân tích.',
            articles: [],
        };
    } else {
        const newsInput: NewsAnalysisInput = { cryptoSymbol, articles: newsArticles };
        newsAnalysisResponse = await analyzeNewsSentiment(newsInput, userAi);
    }
    
    // --- Final AI Crypto Analysis ---
    const aiInput: AnalyzeCryptoPairInput = {
      pair,
      timeframe: primaryTimeframe,
      price: latestPrimaryKline.close,
      mode,
      rsi: primaryRsi,
      macd: { line: primaryMacd.MACD, signal: primaryMacd.signal },
      ema: { ema9: primaryEma9, ema21: primaryEma21 },
      volume: latestPrimaryKline.volume,
      newsSentiment: newsAnalysisResponse.sentiment,
      higherTimeframeData: htfData, // Pass HTF data to the AI
    };
    
    const aiAnalysisResponse = await analyzeCryptoPair(aiInput, userAi);

    const tradingSignalsResponse = { signals: aiAnalysisResponse.signals };

    if (aiAnalysisResponse && discordWebhookUrl) {
        const signal = aiAnalysisResponse.buySellSignal.toUpperCase();
        if (signal.includes('MUA') || signal.includes('BUY') || signal.includes('BÁN') || signal.includes('SELL')) {
            const message = `**Tín hiệu Mới: ${aiAnalysisResponse.buySellSignal.toUpperCase()} ${aiInput.pair} (BYBIT)**
Chế độ: ${aiInput.mode} | Khung: ${aiInput.timeframe} (HTF: ${higherTimeframe || 'N/A'})
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
    if (discordWebhookUrl) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
        const notificationMessage = `**LỖI PHÂN TÍCH (BYBIT)**
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
