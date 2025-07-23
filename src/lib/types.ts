import { z } from "zod";

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AnalysisResult {
  aiAnalysis?: AnalyzeCryptoPairOutput;
  tradingSignals?: TradingSignalsOutput;
  newsAnalysis?: NewsAnalysisOutput;
}

const MACDSchema = z.object({
  line: z.number().describe("The MACD line value."),
  signal: z.number().describe("The signal line value."),
});

const EMASchema = z.object({
  ema9: z.number().describe("The 9-period Exponential Moving Average."),
  ema21: z.number().describe("The 21-period Exponential Moving Average."),
});

// Base input schema for AI analysis
const BaseAnalysisInputSchema = z.object({
  pair: z.string().describe("The cryptocurrency pair to analyze (e.g., ETH/USDT)."),
  timeframe: z.string().describe("The timeframe for the analysis (e.g., 15m, 1h, 4h, 1d)."),
  price: z.number().describe("Current price of the crypto pair."),
  mode: z.enum(["swing", "scalping"]).describe("The trading mode: 'swing' for longer-term, 'scalping' for short-term."),
  rsi: z.number().describe("Relative Strength Index (14) value."),
  macd: MACDSchema,
  ema: EMASchema,
});


// Schema for the combined analyzeCryptoPair flow
export const AnalyzeCryptoPairInputSchema = BaseAnalysisInputSchema.extend({
  high: z.number().describe("The high price of the current candle."),
  low: z.number().describe("The low price of the current candle."),
  volume: z.number().describe("The volume of the most recent candle."),
});
export type AnalyzeCryptoPairInput = z.infer<typeof AnalyzeCryptoPairInputSchema>;

const SignalSchema = z.object({
    indicator: z.string().describe('Tên của chỉ báo kỹ thuật (ví dụ: "RSI", "MACD", "EMA Crossover").'),
    signal: z.enum(["Buy", "Sell", "Neutral", "Mua", "Bán", "Trung tính"]).describe('Tín hiệu giao dịch được suy ra từ chỉ báo.'),
    confidence: z.enum(["High", "Medium", "Low", "Cao", "Trung bình", "Thấp"]).describe('Mức độ tin cậy của tín hiệu.'),
    reasoning: z.string().describe('Giải thích ngắn gọn cho tín hiệu bằng tiếng Việt.')
});

export const AnalyzeCryptoPairOutputSchema = z.object({
  marketOverview: z.string().describe('Đánh giá tổng quan thị trường dựa trên tất cả các chỉ báo.'),
  indicatorExplanations: z.string().describe('Giải thích chi tiết về tín hiệu của từng chỉ báo kỹ thuật.'),
  buySellSignal: z.string().describe('Kết luận cuối cùng: "MUA", "BÁN", hoặc "CHỜ ĐỢI".'),
  entrySuggestion: z.string().describe('Giá hoặc khoảng giá đề xuất để vào lệnh.'),
  stopLossSuggestion: z.string().describe('Mức giá dừng lỗ đề xuất.'),
  takeProfitSuggestion: z.string().describe('Mức giá chốt lời đề xuất.'),
  riskManagementAdvice: z.string().describe('Một mẹo ngắn gọn, có thể hành động để quản lý rủi ro.'),
  signals: z.array(SignalSchema).describe('Một mảng các tín hiệu giao dịch chi tiết từ từng chỉ báo.'),
});
export type AnalyzeCryptoPairOutput = z.infer<typeof AnalyzeCryptoPairOutputSchema>;


// This remains for structuring the data on the frontend, but is now populated by the main analysis
export const TradingSignalsOutputSchema = z.object({
  signals: z.array(SignalSchema).describe('Một mảng các tín hiệu giao dịch.'),
});
export type TradingSignalsOutput = z.infer<typeof TradingSignalsOutputSchema>;

export const NewsArticleSchema = z.object({
    title: z.string().describe("The headline of the news article."),
    url: z.string().describe("The URL to the full news article."),
    source: z.string().describe("The source of the news article (e.g., CoinTelegraph)."),
    snippet: z.string().describe("A short summary or snippet of the article."),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

// Schema for analyzeNewsSentiment flow
export const NewsAnalysisInputSchema = z.object({
  cryptoSymbol: z.string().describe("The cryptocurrency symbol to search news for (e.g., BTC, ETH)."),
  articles: z.array(NewsArticleSchema).describe("The list of news articles to be analyzed."),
});
export type NewsAnalysisInput = z.infer<typeof NewsAnalysisInputSchema>;

export const NewsAnalysisOutputSchema = z.object({
    sentiment: z.enum(["Positive", "Negative", "Neutral"]).describe("The overall market sentiment based on the news. MUST be one of the three English strings."),
    summary: z.string().describe("A summary of the key news affecting the cryptocurrency."),
    reasoning: z.string().describe("An explanation for why the sentiment was determined."),
    articles: z.array(NewsArticleSchema).describe("A list of the news articles that were analyzed."),
});
export type NewsAnalysisOutput = z.infer<typeof NewsAnalysisOutputSchema>;
