import type { AnalyzeCryptoPairOutput } from "@/ai/flows/analyze-crypto-pair";

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AnalysisResult {
  klineData: KlineData[];
  aiAnalysis: AnalyzeCryptoPairOutput;
}
