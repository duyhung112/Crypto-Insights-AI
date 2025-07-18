"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
import { Loader, AlertTriangle, AreaChart, Zap, Settings, RefreshCw, Bell } from "lucide-react";
import { getAnalysis } from "@/app/actions";
import type { AnalysisResult } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisDisplay } from "@/components/analysis-display";
import { ThemeToggle } from "@/components/theme-toggle";
import { TradingSignalsDisplay } from "@/components/trading-signals-display";
import { RealtimeTicker } from "@/components/RealtimeTicker";
import { NewsAnalysisDisplay } from "@/components/news-analysis-display";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

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

const MONITORING_INTERVAL = 15 * 60 * 1000; // 15 minutes

export default function Home() {
  const [pair, setPair] = useState("ETHUSDT");
  const [timeframe, setTimeframe] = useState("60");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'swing' | 'scalping'>("swing");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnalyze = useCallback(async (currentPair: string, currentTimeframe: string, currentMode: 'swing' | 'scalping', isSilent = false) => {
    if (!isSilent) {
        setLoading(true);
        setError(null);
        setResult(null);
    }
    
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    if (!geminiApiKey) {
        if (!isSilent) {
            toast({
                variant: "destructive",
                title: "Thiếu Gemini API Key",
                description: "Vui lòng vào Cài đặt để thêm API Key của bạn trước khi phân tích.",
            });
            setLoading(false);
        }
        return;
    }

    const discordWebhookUrl = localStorage.getItem('discordWebhookUrl') || undefined;
    const analysisTimeframe = currentMode === 'scalping' ? '5' : currentTimeframe;
    const response = await getAnalysis(currentPair, analysisTimeframe, currentMode, discordWebhookUrl, geminiApiKey);

    if (response.error && !isSilent) {
      setError(response.error);
    } else if (!response.error) {
      setResult({ 
        aiAnalysis: response.aiAnalysis,
        tradingSignals: response.tradingSignals,
        newsAnalysis: response.newsAnalysis,
      });
    }

    if (!isSilent) {
        setLoading(false);
    }
  }, [toast]);

  const handleMonitoringChange = (checked: boolean) => {
    setIsMonitoring(checked);
    if (checked) {
        const discordWebhookUrl = localStorage.getItem('discordWebhookUrl') || '';
        if (!discordWebhookUrl) {
            toast({
                variant: "destructive",
                title: "Thiếu Discord Webhook URL",
                description: "Vui lòng vào Cài đặt để thêm URL trước khi bật giám sát.",
            });
            setIsMonitoring(false);
            return;
        }
        toast({
            title: "Đã bật Giám sát Tự động",
            description: `Hệ thống sẽ kiểm tra tín hiệu cho ${pair} mỗi 15 phút.`,
        });
    } else {
        toast({
            title: "Đã tắt Giám sát Tự động",
        });
    }
  }

  // Effect to run analysis on initial load and when selections change
  useEffect(() => {
    handleAnalyze(pair, timeframe, mode);
  // We only want this to run when the pair or mode changes, not timeframe.
  // Timeframe changes will be handled by the manual refresh button.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, mode]);

  // Effect to handle the monitoring interval
  useEffect(() => {
      if (isMonitoring) {
          // Clear any existing interval
          if (monitoringIntervalRef.current) {
              clearInterval(monitoringIntervalRef.current);
          }
          // Start a new interval
          monitoringIntervalRef.current = setInterval(() => {
              console.log(`[Monitoring] Checking for signals for ${pair}...`);
              const analysisTimeframe = mode === 'scalping' ? '5' : timeframe;
              // Run analysis silently
              handleAnalyze(pair, analysisTimeframe, mode, true);
          }, MONITORING_INTERVAL);
      } else {
          // Clear interval if monitoring is turned off
          if (monitoringIntervalRef.current) {
              clearInterval(monitoringIntervalRef.current);
              monitoringIntervalRef.current = null;
          }
      }
      
      // Cleanup function to clear interval on component unmount
      return () => {
          if (monitoringIntervalRef.current) {
              clearInterval(monitoringIntervalRef.current);
          }
      }
  }, [isMonitoring, pair, timeframe, mode, handleAnalyze]);


  const onRefreshClick = () => {
    handleAnalyze(pair, timeframe, mode);
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8 bg-background transition-colors duration-300">
      <div className="w-full max-w-7xl space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
                 <h1 className="font-headline text-2xl font-bold text-foreground">
                    Trading Expert AI
                </h1>
            </div>
             <div className="flex w-full sm:w-auto items-center gap-4 justify-between sm:justify-end">
                <div className="flex flex-col items-start sm:items-end">
                    <Label className="text-xs text-muted-foreground mb-1">Chế độ</Label>
                    <Tabs value={mode} onValueChange={(value) => setMode(value as 'swing' | 'scalping')} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="swing" className="flex items-center gap-2 text-xs">
                                <AreaChart className="h-4 w-4"/>
                                Swing (5m+)
                            </TabsTrigger>
                            <TabsTrigger value="scalping" className="flex items-center gap-2 text-xs">
                                <Zap className="h-4 w-4"/>
                                Scalping (1m)
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="flex items-center gap-2 pt-5">
                    <Link href="/settings">
                        <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Cài đặt</span>
                        </Button>
                    </Link>
                    <ThemeToggle />
                </div>
            </div>
        </header>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">Thông tin và Biểu đồ {pair}</CardTitle>
                <CardDescription className="text-xs">
                    Khung thời gian: {mode === 'scalping' ? '1 phút' : timeframes.find(t => t.value === timeframe)?.label}. Dữ liệu giá được cập nhật theo thời gian thực.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RealtimeTicker pair={pair} />
                <div className="h-[600px] mt-4">
                    <TradingViewChart pair={pair} timeframe={mode === 'scalping' ? '1' : timeframe}/>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">Bảng điều khiển và Giám sát</CardTitle>
                <CardDescription className="text-xs">
                Chọn cặp tiền, khung thời gian và bật giám sát để nhận thông báo tự động.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
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
                    <Label htmlFor="timeframe-select" className="text-xs">Khung thời gian (Swing)</Label>
                    <Select value={timeframe} onValueChange={setTimeframe} disabled={loading || mode === 'scalping'}>
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
                <div className="flex items-center">
                    <Button onClick={onRefreshClick} disabled={loading} className="w-full">
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
                 <div className="flex items-center space-x-2 justify-end">
                    <Bell className={`h-4 w-4 ${isMonitoring ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Label htmlFor="monitoring-switch" className={`text-xs ${isMonitoring ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {isMonitoring ? 'Giám sát: Bật' : 'Giám sát: Tắt'}
                    </Label>
                    <Switch
                        id="monitoring-switch"
                        checked={isMonitoring}
                        onCheckedChange={handleMonitoringChange}
                        disabled={loading}
                    />
                </div>
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
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis">Phân tích AI ({mode === 'scalping' ? 'Scalping' : 'Swing'})</TabsTrigger>
                    <TabsTrigger value="signals">Tín hiệu Giao dịch ({mode === 'scalping' ? 'Scalping' : 'Swing'})</TabsTrigger>
                    <TabsTrigger value="news">Tin tức &amp; Tâm lý</TabsTrigger>
                </TabsList>
                <TabsContent value="analysis">
                    {result.aiAnalysis && <AnalysisDisplay analysis={result.aiAnalysis} />}
                </TabsContent>
                <TabsContent value="signals">
                    {result.tradingSignals && <TradingSignalsDisplay signals={result.tradingSignals} />}
                </TabsContent>
                <TabsContent value="news">
                    {result.newsAnalysis && <NewsAnalysisDisplay analysis={result.newsAnalysis} />}
                </TabsContent>
                </Tabs>
            </div>
        )}

      </div>
    </main>
  );
}
