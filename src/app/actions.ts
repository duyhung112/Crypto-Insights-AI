
"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import { initGenkit } from "@/ai/genkit";
import type { AnalyzeCryptoPairInput, KlineData, NewsAnalysisInput, AnalyzeCryptoPairOutput, NewsArticle } from "@/lib/types";
import { RSI, MACD, EMA } from "technicalindicators";
import { sendDiscordNotification, getNewsForCrypto } from "@/lib/tools";

export async function getKlineData(pair: string, timeframe: string, limit: number = 200): Promise<KlineData[]> {
    const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${pair}&interval=${timeframe}&limit=${limit}`;
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Bybit API error:", errorBody);
            throw new Error(`Bybit API Error: ${response.statusText}`);
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


async function handleDiscordNotification(message: string, webhookUrl: string) {
    if (!webhookUrl) return;
    try {
        await sendDiscordNotification({ message, webhookUrl });
    } catch (error) {
        console.error("Failed to send Discord notification from action:", error);
    }
}

export async function getAnalysis(pair: string, timeframe: string, mode: 'swing' | 'scalping', exchange: string, discordWebhookUrl?: string, geminiApiKey?: string) {
  if (exchange !== 'bybit') {
    return { error: "Sàn giao dịch này chưa được hỗ trợ để phân tích." };
  }
    
  try {
    if (!geminiApiKey) {
      throw new Error("Vui lòng cung cấp Gemini API Key trong phần Cài đặt để sử dụng tính năng phân tích.");
    }
    
    // Initialize Genkit dynamically with the user's API key
    const userAi = initGenkit(geminiApiKey);

    const klineData = await getKlineData(pair, timeframe, 200);

    if (klineData.length < 50) { // Need enough data for indicators
      throw new Error("Không đủ dữ liệu lịch sử để phân tích cặp tiền này.");
    }

    const closePrices = klineData.map((k) => k.close);
    const latestPrice = closePrices[closePrices.length - 1];

    // Calculate indicators
    const rsiResult = RSI.calculate({ values: closePrices, period: 14 });
    const macdInput = {
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMA: false,
    };
    const macdResult = MACD.calculate(macdInput);
    const ema9Result = EMA.calculate({ values: closePrices, period: 9 });
    const ema21Result = EMA.calculate({ values: closePrices, period: 21 });

    // Get the latest values
    const latestRsi = rsiResult[rsiResult.length - 1];
    const latestMacdLine = macdResult[macdResult.length - 1]?.MACD;
    const latestMacdSignal = macdResult[macdResult.length - 1]?.signal;
    const latestEma9 = ema9Result[ema9Result.length - 1];
    const latestEma21 = ema21Result[ema21Result.length - 1];
    
    if (
      latestRsi === undefined ||
      latestMacdLine === undefined ||
      latestMacdSignal === undefined ||
      latestEma9 === undefined ||
      latestEma21 === undefined
    ) {
      throw new Error("Không thể tính toán các chỉ báo kỹ thuật. Cần thêm dữ liệu.");
    }

    const aiInput: AnalyzeCryptoPairInput = {
      pair,
      timeframe,
      price: latestPrice,
      mode,
      rsi: latestRsi,
      macd: {
        line: latestMacdLine,
        signal: latestMacdSignal,
      },
      ema: {
        ema9: latestEma9,
        ema21: latestEma21,
      },
      high: klineData[klineData.length - 1].high,
      low: klineData[klineData.length - 1].low,
    };
    
    const cryptoSymbol = pair.replace(/USDT$/, '');
    
    const newsArticles = await getNewsForCrypto({ cryptoSymbol });

    const newsInput: NewsAnalysisInput = {
      cryptoSymbol,
      articles: newsArticles,
    };

    // Use the dynamically created Genkit instance to call the flows
    const [aiAnalysisResponse, newsAnalysisResponse] = await Promise.all([
        analyzeCryptoPair(aiInput, userAi),
        analyzeNewsSentiment(newsInput, userAi),
    ]);
    
    const tradingSignalsResponse = { signals: aiAnalysisResponse.signals };

    if (aiAnalysisResponse && discordWebhookUrl) {
        const signal = aiAnalysisResponse.buySellSignal.toUpperCase();
        if (signal.includes('MUA') || signal.includes('BUY') || signal.includes('BÁN') || signal.includes('SELL')) {
            const message = `**Tín hiệu Mới: ${aiAnalysisResponse.buySellSignal.toUpperCase()} ${aiInput.pair} (Bybit)**
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
    if (discordWebhookUrl) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
        const notificationMessage = `**LỖI PHÂN TÍCH (Bybit)**
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

    