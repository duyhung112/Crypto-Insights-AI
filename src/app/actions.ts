"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import type { AnalyzeCryptoPairInput, KlineData, NewsAnalysisInput, AnalyzeCryptoPairOutput, NewsArticle } from "@/lib/types";
import { RSI, MACD, EMA } from "technicalindicators";
import { sendDiscordNotificationTool } from "@/lib/tools/discord-tool";
import { getNewsForCryptoTool } from "@/lib/tools";

const BYBIT_API_URL = "https://api.bybit.com";

interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    symbol: string;
    list: string[][];
  };
  retExtInfo: object;
  time: number;
}

export async function getKlineData(pair: string, timeframe: string, limit: number = 200): Promise<KlineData[]> {
    const url = `${BYBIT_API_URL}/v5/market/kline?category=linear&symbol=${pair}&interval=${timeframe}&limit=${limit}`;

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Bybit API error response:", errorBody);
      throw new Error(`Bybit API Error: ${response.statusText}`);
    }

    const data: BybitKlineResponse = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API Error: ${data.retMsg}`);
    }

    if (!data.result.list || data.result.list.length === 0) {
      return [];
    }

    const klineData: KlineData[] = data.result.list
      .map((d) => ({
        time: parseInt(d[0]),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
      }))
      .reverse(); // Bybit returns newest first, so reverse
    
    return klineData;
}

// Function to handle sending Discord notification
async function handleDiscordNotification(
  analysis: AnalyzeCryptoPairOutput,
  input: AnalyzeCryptoPairInput
) {
  const signal = analysis.buySellSignal.toUpperCase();
  if ((signal.includes('MUA') || signal.includes('BUY') || signal.includes('BÁN') || signal.includes('SELL')) && input.discordWebhookUrl) {
    try {
      const message = `**Tín hiệu Mới: ${analysis.buySellSignal.toUpperCase()} ${input.pair}**
Chế độ: ${input.mode}
Giá hiện tại: ${input.price}
---
**Kế hoạch Giao dịch Đề xuất:**
- **Vào lệnh:** ${analysis.entrySuggestion}
- **Dừng lỗ (SL):** ${analysis.stopLossSuggestion}
- **Chốt lời (TP):** ${analysis.takeProfitSuggestion}`;
      
      await sendDiscordNotificationTool({
        message,
        webhookUrl: input.discordWebhookUrl,
      });
    } catch (error) {
      console.error("Failed to send Discord notification from action:", error);
    }
  }
}

export async function getAnalysis(pair: string, timeframe: string, mode: 'swing' | 'scalping', discordWebhookUrl?: string) {
  try {
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
      // Pass OHLC for context, though indicators are primary
      high: klineData[klineData.length - 1].high,
      low: klineData[klineData.length - 1].low,
      discordWebhookUrl: discordWebhookUrl || '',
    };
    
    // Extract the base asset (e.g., "BTC" from "BTCUSDT")
    const cryptoSymbol = pair.replace(/USDT$/, '');
    
    // Fetch news first, then call AI flows
    const newsArticles = await getNewsForCryptoTool({ cryptoSymbol });

    const newsInput: NewsAnalysisInput = {
      cryptoSymbol,
      articles: newsArticles,
    };

    // Call AI Flows in parallel
    const [aiAnalysisResponse, newsAnalysisResponse] = await Promise.all([
        analyzeCryptoPair(aiInput),
        analyzeNewsSentiment(newsInput),
    ]);
    
    const tradingSignalsResponse = { signals: aiAnalysisResponse.signals };

    // After getting the analysis, handle the notification
    if (aiAnalysisResponse) {
        await handleDiscordNotification(aiAnalysisResponse, aiInput);
    }
    
    return { 
        aiAnalysis: aiAnalysisResponse,
        tradingSignals: tradingSignalsResponse,
        newsAnalysis: newsAnalysisResponse,
     };
  } catch (error) {
    console.error("Error in getAnalysis:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}
