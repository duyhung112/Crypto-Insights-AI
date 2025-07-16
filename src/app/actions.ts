"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import { initGenkit } from "@/ai/genkit";
import type { AnalyzeCryptoPairInput, KlineData, NewsAnalysisInput, AnalyzeCryptoPairOutput, NewsArticle } from "@/lib/types";
import { RSI, MACD, EMA } from "technicalindicators";
import { sendDiscordNotificationTool } from "@/lib/tools/discord-tool";
import { getNewsForCryptoTool } from "@/lib/tools";
import { bybitClient } from "@/lib/bybit-client";

export async function getKlineData(pair: string, timeframe: string, limit: number = 200): Promise<KlineData[]> {
    const result = await bybitClient.getKline(pair, timeframe, limit);

    if (!result.list || result.list.length === 0) {
      return [];
    }

    const klineData: KlineData[] = result.list
      .map((d: string[]) => ({
        time: parseInt(d[0]),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
      }))
      .reverse(); // Bybit returns newest first, so reverse
    
    return klineData;
}

async function sendDiscordNotification(message: string, webhookUrl: string) {
    if (!webhookUrl) return;
    try {
        await sendDiscordNotificationTool({ message, webhookUrl });
    } catch (error) {
        console.error("Failed to send Discord notification from action:", error);
    }
}

export async function getAnalysis(pair: string, timeframe: string, mode: 'swing' | 'scalping', discordWebhookUrl?: string, geminiApiKey?: string) {
  try {
    if (!geminiApiKey) {
      throw new Error("Gemini API Key is required for analysis.");
    }
    
    // Initialize Genkit dynamically with the user's API key
    const userAi = initGenkit(geminiApiKey);

    const klineData = await getKlineData(pair, timeframe, 200);

    if (klineData.length < 50) { // Need enough data for indicators
      throw new Error("Not enough historical data to analyze this pair.");
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
      throw new Error("Could not calculate technical indicators. More data might be needed.");
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
    
    const newsArticles = await getNewsForCryptoTool({ cryptoSymbol });

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
            const message = `**Tín hiệu Mới: ${aiAnalysisResponse.buySellSignal.toUpperCase()} ${aiInput.pair}**
Chế độ: ${aiInput.mode}
Giá hiện tại: ${aiInput.price}
---
**Kế hoạch Giao dịch Đề xuất:**
- **Vào lệnh:** ${aiAnalysisResponse.entrySuggestion}
- **Dừng lỗ (SL):** ${aiAnalysisResponse.stopLossSuggestion}
- **Chốt lời (TP):** ${aiAnalysisResponse.takeProfitSuggestion}`;
            await sendDiscordNotification(message, discordWebhookUrl);
        }
    }
    
    return { 
        aiAnalysis: aiAnalysisResponse,
        tradingSignals: tradingSignalsResponse,
        newsAnalysis: newsAnalysisResponse,
     };
  } catch (error) {
    console.error("Error in getAnalysis:", error);

    if (discordWebhookUrl) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        const notificationMessage = `**Lỗi Phân tích**
Cặp: ${pair}
Lỗi: \`\`\`${errorMessage}\`\`\``;
        await sendDiscordNotification(notificationMessage, discordWebhookUrl);
    }
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}
