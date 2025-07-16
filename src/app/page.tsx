"use client";

import { useState, useCallback, useTransition } from "react";
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, BarChart, AlertTriangle } from "lucide-react";
import { getAnalysis } from "@/app/actions";
import type { AnalysisResult } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisDisplay } from "@/components/analysis-display";


const TradingViewChart = dynamic(() => import('@/components/tradingview-chart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[500px]" />,
});

const pairs = [
  { value: "BTCUSDT", label: "BTC/USDT" },
  { value: "ETHUSDT", label: "ETH/USDT" },
  { value: "SOLUSDT", label: "SOL/USDT" },
  { value: "BNBUSDT", label: "BNB/USDT" },
  { value: "XRPUSDT", label: "XRP/USDT" },
];

const timeframes = [
  { value: "15", label: "15 phút" },
  { value: "60", label: "1 giờ" },
  { value: "240", label: "4 giờ" },
  { value: "D", label: "1 ngày" },
];

export default function Home() {
  const [pair, setPair] = useState("ETHUSDT");
  const [timeframe, setTimeframe] = useState("60");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await getAnalysis(pair, timeframe);

    if (response.error) {
      setError(response.error);
    } else {
      // The analysis result no longer contains chart data
      // as the TradingView widget handles its own data.
      setResult({ aiAnalysis: response.aiAnalysis });
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background transition-colors duration-300">
      <div className="w-full max-w-6xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
            Crypto Insights AI
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Phân tích kỹ thuật tiền mã hóa bằng trí tuệ nhân tạo
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Bảng điều khiển</CardTitle>
            <CardDescription>
              Chọn cặp tiền mã hóa và khung thời gian để xem biểu đồ và bắt đầu phân tích.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="pair-select">Cặp tiền</Label>
                <Select value={pair} onValueChange={setPair}>
                  <SelectTrigger id="pair-select">
                    <SelectValue placeholder="Chọn cặp tiền" />
                  </SelectTrigger>
                  <SelectContent>
                    {pairs.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeframe-select">Khung thời gian</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger id="timeframe-select">
                    <SelectValue placeholder="Chọn khung thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-accent text-accent-foreground hover:bg-accent/90 w-full md:col-start-3"
              >
                {loading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart className="mr-2 h-4 w-4" />
                )}
                {loading ? "Đang phân tích..." : "Phân tích"}
              </Button>
            </div>
             <div className="pt-4 h-[500px]">
                <TradingViewChart pair={pair} timeframe={timeframe}/>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex flex-col justify-center items-center p-16 space-y-4">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang lấy dữ liệu và phân tích...</p>
          </div>
        )}

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader className="flex flex-row items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-destructive">Đã xảy ra lỗi</CardTitle>
                <CardDescription className="text-destructive/80">
                  {error}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

        {result && result.aiAnalysis && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <AnalysisDisplay analysis={result.aiAnalysis} />
          </div>
        )}
      </div>
    </main>
  );
}
