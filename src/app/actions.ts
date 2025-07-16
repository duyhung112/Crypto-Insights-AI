"use server";

import { analyzeCryptoPair } from "@/ai/flows/analyze-crypto-pair";
import type { KlineData, MacdData, RsiData } from "@/lib/types";
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

async function fetchKlineData(pair: string, timeframe: string, limit: number = 200): Promise<KlineData[]> {
    const url = `${BYBIT_API_URL}/v5/market/kline?category=spot&symbol=${pair}&interval=${timeframe}&limit=${limit}`;

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
      throw new Error("Không có dữ liệu trả về từ API Bybit cho cặp tiền này.");
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

export async function getKlineData(pair: string, timeframe: string) {
    try {
        return { klineData: await fetchKlineData(pair, timeframe) };
    } catch (error) {
        console.error("Error in getKlineData:", error);
        if (error instanceof Error) {
        return { error: error.message };
        }
        return { error: "Một lỗi không xác định đã xảy ra." };
    }
}


export async function getAnalysis(pair: string, timeframe: string) {
  try {
    const klineData = await fetchKlineData(pair, timeframe, 200);

    const closePrices = klineData.map((k) => k.close);
    const latestPrice = closePrices[closePrices.length - 1];

    // Calculate indicators
    const rsiPeriod = 14;
    const rsiResult = RSI.calculate({ values: closePrices, period: rsiPeriod });

    const macdInput = {
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMA: false,
    };
    const macdResult = MACD.calculate(macdInput);
    const emaResult = EMA.calculate({ values: closePrices, period: 50 });

    // Get the latest values
    const latestRsi = rsiResult[rsiResult.length - 1];
    const latestMacd = macdResult[macdResult.length - 1]?.MACD;
    const latestEma = emaResult[emaResult.length - 1];

    if (
      latestRsi === undefined ||
      latestMacd === undefined ||
      latestEma === undefined
    ) {
      throw new Error("Không thể tính toán các chỉ báo kỹ thuật. Cần nhiều dữ liệu hơn.");
    }

    // Call AI Flow
    const aiAnalysis = await analyzeCryptoPair({
      pair,
      timeframe,
      price: latestPrice,
      rsi: latestRsi,
      macd: latestMacd,
      ema: latestEma,
    });
    
    // Prepare indicator data for charts
    const rsiData: RsiData[] = rsiResult.map((value, index) => ({
      time: klineData[index + rsiPeriod -1].time,
      value: value,
    }));

    const macdData: MacdData[] = macdResult.map((value, index) => ({
        time: klineData[index + macdInput.slowPeriod - 1].time,
        ...value
    }));


    return { klineData, aiAnalysis, rsiData, macdData };
  } catch (error) {
    console.error("Error in getAnalysis:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Một lỗi không xác định đã xảy ra." };
  }
}
