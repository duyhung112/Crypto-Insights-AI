"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import { generateTradingSignals } from "@/ai/flows/generate-trading-signals";
import type { AnalyzeCryptoPairInput, KlineData, TradingSignalsInput } from "@/lib/types";
import { RSI, MACD, EMA } from "technicalindicators";

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
      throw new Error(`Lỗi API Bybit: ${response.statusText}`);
    }

    const data: BybitKlineResponse = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Lỗi API Bybit: ${data.retMsg}`);
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

export async function getAnalysis(pair: string, timeframe: string) {
  try {
    const klineData = await getKlineData(pair, timeframe, 200);

    if (klineData.length < 50) { // Need enough data for indicators
      throw new Error("Không có đủ dữ liệu lịch sử để phân tích cho cặp tiền này.");
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
      throw new Error("Không thể tính toán các chỉ báo kỹ thuật. Cần nhiều dữ liệu hơn.");
    }

    const aiInput: AnalyzeCryptoPairInput = {
      pair,
      timeframe,
      price: latestPrice,
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
    };
    
    // Call AI Flows in parallel
    const [aiAnalysisResponse, tradingSignalsResponse] = await Promise.all([
        analyzeCryptoPair(aiInput),
        generateTradingSignals(aiInput as TradingSignalsInput) // TradingSignalsInput is a subset of AnalyzeCryptoPairInput
    ]);
    
    return { 
        aiAnalysis: aiAnalysisResponse,
        tradingSignals: tradingSignalsResponse,
     };
  } catch (error) {
    console.error("Error in getAnalysis:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Một lỗi không xác định đã xảy ra." };
  }
}
