import type { AnalyzeCryptoPairOutput } from "@/ai/flows/analyze-crypto-pair";

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface RsiData {
    time: number;
    value: number;
}

export interface MacdData {
    time: number;
    MACD?: number;
    signal?: number;
    histogram?: number;
}


export interface AnalysisResult {
  aiAnalysis: AnalyzeCryptoPairOutput;
}
