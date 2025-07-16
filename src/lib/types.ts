import type { AnalyzeCryptoPairOutput as GenkitAnalyzeCryptoPairOutput } from "@/ai/flows/analyze-crypto-pair";
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

const MACDSchema = z.object({
  line: z.number().describe("The MACD line value."),
  signal: z.number().describe("The signal line value."),
});

const EMASchema = z.object({
  ema9: z.number().describe("The 9-period Exponential Moving Average."),
  ema21: z.number().describe("The 21-period Exponential Moving Average."),
});

// Common input schema for AI flows
const BaseAnalysisInputSchema = z.object({
  pair: z.string().describe("The cryptocurrency pair to analyze (e.g., ETH/USDT)."),
  timeframe: z.string().describe("The timeframe for the analysis (e.g., 15m, 1h, 4h, 1d)."),
  price: z.number().describe("Current price of the crypto pair."),
  rsi: z.number().describe("Relative Strength Index (14) value."),
  macd: MACDSchema,
  ema: EMASchema,
});

// Schema for analyzeCryptoPair flow
export const AnalyzeCryptoPairInputSchema = BaseAnalysisInputSchema.extend({
  high: z.number().describe("The high price of the current candle."),
  low: z.number().describe("The low price of the current candle."),
});
export type AnalyzeCryptoPairInput = z.infer<typeof AnalyzeCryptoPairInputSchema>;

export const AnalyzeCryptoPairOutputSchema = z.object({
  marketOverview: z.string().describe('Overall market assessment based on all indicators.'),
  indicatorExplanations: z.string().describe('Detailed explanations of what each technical indicator is signaling.'),
  buySellSignal: z.string().describe('The final conclusion: "BUY", "SELL", or "HOLD".'),
  entrySuggestion: z.string().describe('Suggested entry price or range.'),
  stopLossSuggestion: z.string().describe('Suggested stop-loss price level.'),
  takeProfitSuggestion: z.string().describe('Suggested take-profit price level.'),
  riskManagementAdvice: z.string().describe('A short, actionable tip for risk management.'),
});
export type AnalyzeCryptoPairOutput = z.infer<typeof AnalyzeCryptoPairOutputSchema>;


// Schema for generateTradingSignals flow
export const TradingSignalsInputSchema = BaseAnalysisInputSchema.extend({
   // The 'ema' field in the prompt uses ema.ema21, but the type in `generate-trading-signals.ts` expects `ema`. Let's just pass ema21 as ema.
  ema: z.number().describe("The 50-period Exponential Moving Average value. We will use ema21 for this."),
  macd: z.number().describe("The MACD line value."),
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
