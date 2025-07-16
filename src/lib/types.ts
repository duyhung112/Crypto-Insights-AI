import type { AnalyzeCryptoPairOutput } from "@/ai/flows/analyze-crypto-pair";
import { z } from "zod";

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AnalysisResult {
  aiAnalysis?: AnalyzeCryptoPairOutput;
  tradingSignals?: TradingSignalsOutput;
}

// Schema for generateTradingSignals flow
export const TradingSignalsInputSchema = z.object({
  pair: z.string().describe("The cryptocurrency pair to analyze (e.g., ETH/USDT)."),
  timeframe: z.string().describe("The timeframe for the analysis (e.g., 15m, 1h, 4h, 1d)."),
  price: z.number().describe("Current price of the crypto pair"),
  rsi: z.number().describe("Relative Strength Index value"),
  macd: z.number().describe("Moving Average Convergence Divergence value"),
  ema: z.number().describe("Exponential Moving Average value"),
});
export type TradingSignalsInput = z.infer<typeof TradingSignalsInputSchema>;

const SignalSchema = z.object({
    indicator: z.string().describe('The name of the technical indicator (e.g., "RSI", "MACD", "EMA vs Price").'),
    signal: z.enum(["Buy", "Sell", "Neutral"]).describe('The trading signal derived from the indicator.'),
    confidence: z.enum(["High", "Medium", "Low"]).describe('The confidence level of the signal.'),
    reasoning: z.string().describe('A brief explanation for the signal in Vietnamese.')
});

export const TradingSignalsOutputSchema = z.object({
  signals: z.array(SignalSchema).describe('An array of trading signals.'),
});
export type TradingSignalsOutput = z.infer<typeof TradingSignalsOutputSchema>;
