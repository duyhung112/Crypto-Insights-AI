"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, AlertTriangle } from "lucide-react";
import { getAnalysis } from "@/app/actions";
import type { AnalysisResult } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisDisplay } from "@/components/analysis-display";
import { ThemeToggle } from "@/components/theme-toggle";
import { TradingSignalsDisplay } from "@/components/trading-signals-display";
import { RealtimeTicker } from "@/components/RealtimeTicker";


const TradingViewChart = dynamic(() => import('@/components/tradingview-chart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full min-h-[500px]" />,
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
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (currentPair: string, currentTimeframe: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await getAnalysis(currentPair, currentTimeframe);

    if (response.error) {
      setError(response.error);
    } else {
      setResult({ 
        aiAnalysis: response.aiAnalysis,
        tradingSignals: response.tradingSignals,
      });
    }

    setLoading(false);
  }, []);

  // Effect to run analysis on initial load and when selections change
  useEffect(() => {
    handleAnalyze(pair, timeframe);
  }, [pair, timeframe, handleAnalyze]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8 bg-background transition-colors duration-300">
      <div className="w-full max-w-7xl space-y-6">
        <header className="text-center relative">
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-primary">
            Phân tích Xu hướng Thị trường
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Phân tích kỹ thuật tiền mã hóa bằng AI cho thị trường Tương lai.
          </p>
           <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
        </header>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">Thông tin và Biểu đồ {pair}</CardTitle>
                <CardDescription className="text-xs">
                    Khung thời gian: {timeframes.find(t => t.value === timeframe)?.label}. Dữ liệu giá được cập nhật theo thời gian thực.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RealtimeTicker pair={pair} />
                <div className="h-[600px] mt-4">
                    <TradingViewChart pair={pair} timeframe={timeframe}/>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">Bảng điều khiển</CardTitle>
                <CardDescription className="text-xs">
                Chọn một cặp tiền và khung thời gian để phân tích tự động.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="pair-select" className="text-xs">Cặp tiền</Label>
                    <Select value={pair} onValueChange={setPair} disabled={loading}>
                    <SelectTrigger id="pair-select" className="text-xs">
                        <SelectValue placeholder="Chọn một cặp tiền" />
                    </SelectTrigger>
                    <SelectContent>
                        {pairs.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">
                            {p.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timeframe-select" className="text-xs">Khung thời gian</Label>
                    <Select value={timeframe} onValueChange={setTimeframe} disabled={loading}>
                    <SelectTrigger id="timeframe-select" className="text-xs">
                        <SelectValue placeholder="Chọn một khung thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeframes.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                {loading && (
                    <div className="flex items-center text-xs text-muted-foreground pt-2 self-end">
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        <span>Đang phân tích...</span>
                    </div>

                )}
            </CardContent>
        </Card>

        {loading && !result && !error && (
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
                    <CardTitle className="text-destructive text-base">Đã có lỗi xảy ra</CardTitle>
                    <CardDescription className="text-destructive/80 text-xs">
                    {error}
                    </CardDescription>
                </div>
                </CardHeader>
            </Card>
        )}

        {result && (
            <div className="animate-in fade-in duration-500">
                <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analysis">Phân tích AI</TabsTrigger>
                    <TabsTrigger value="signals">Tín hiệu Giao dịch</TabsTrigger>
                </TabsList>
                <TabsContent value="analysis">
                    {result.aiAnalysis && <AnalysisDisplay analysis={result.aiAnalysis} />}
                </TabsContent>
                <TabsContent value="signals">
                    {result.tradingSignals && <TradingSignalsDisplay signals={result.tradingSignals} />}
                </TabsContent>
                </Tabs>
            </div>
        )}

      </div>
    </main>
  );
}
