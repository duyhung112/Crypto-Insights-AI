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
  marketOverview: z.string().describe('Đánh giá tổng quan thị trường dựa trên tất cả các chỉ báo.'),
  indicatorExplanations: z.string().describe('Giải thích chi tiết về tín hiệu của từng chỉ báo kỹ thuật.'),
  buySellSignal: z.string().describe('Kết luận cuối cùng: "MUA", "BÁN", hoặc "GIỮ".'),
  entrySuggestion: z.string().describe('Giá hoặc khoảng giá đề xuất để vào lệnh.'),
  stopLossSuggestion: z.string().describe('Mức giá dừng lỗ đề xuất.'),
  takeProfitSuggestion: z.string().describe('Mức giá chốt lời đề xuất.'),
  riskManagementAdvice: z.string().describe('Một mẹo ngắn gọn, có thể hành động để quản lý rủi ro.'),
});
export type AnalyzeCryptoPairOutput = z.infer<typeof AnalyzeCryptoPairOutputSchema>;


// Schema for generateTradingSignals flow
export const TradingSignalsInputSchema = BaseAnalysisInputSchema.extend({
   // The 'ema' field in the prompt uses ema.ema21, but the type in `generate-trading-signals.ts` expects `ema`. Let's just pass ema21 as ema.
  ema: z.number().describe("The 21-period Exponential Moving Average value."),
  macd: z.number().describe("The MACD line value."),
});
export type TradingSignalsInput = z.infer<typeof TradingSignalsInputSchema>;

const SignalSchema = z.object({
    indicator: z.string().describe('Tên của chỉ báo kỹ thuật (ví dụ: "RSI", "MACD", "EMA và Giá").'),
    signal: z.enum(["Buy", "Sell", "Neutral", "Mua", "Bán", "Trung tính"]).describe('Tín hiệu giao dịch được suy ra từ chỉ báo.'),
    confidence: z.enum(["High", "Medium", "Low", "Cao", "Trung bình", "Thấp"]).describe('Mức độ tin cậy của tín hiệu.'),
    reasoning: z.string().describe('Giải thích ngắn gọn cho tín hiệu bằng tiếng Việt.')
});

export const TradingSignalsOutputSchema = z.object({
  signals: z.array(SignalSchema).describe('Một mảng các tín hiệu giao dịch.'),
});
export type TradingSignalsOutput = z.infer<typeof TradingSignalsOutputSchema>;
