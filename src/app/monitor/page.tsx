// This is a new file created by Firebase Studio.
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAnalysis } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader, BellRing, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MONITORING_INTERVAL = 15 * 60 * 1000; // 15 minutes

function MonitorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const pair = searchParams.get('pair') || 'BTCUSDT';
  const timeframe = searchParams.get('timeframe') || '15';
  const mode = (searchParams.get('mode') as 'swing' | 'scalping') || 'swing';

  const [status, setStatus] = useState('Đang khởi tạo...');
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [nextCheck, setNextCheck] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [lastSignal, setLastSignal] = useState('Chưa có');

  useEffect(() => {
    let isMounted = true;
    const discordWebhookUrl = localStorage.getItem('discordWebhookUrl') || '';
    if (!discordWebhookUrl) {
      router.push('/settings?error=Discord_Webhook_URL_is_required_for_monitoring');
      return;
    }

    const runCheck = async () => {
      if (!isMounted) return;
      setStatus(`Đang kiểm tra tín hiệu cho ${pair}...`);
      setLastSignal('Đang phân tích...');
      
      const response = await getAnalysis(pair, timeframe, mode, discordWebhookUrl);
      
      if (!isMounted) return;

      if (response.error) {
        setStatus(`Lỗi: ${response.error}`);
        setLastSignal('Thất bại');
      } else if (response.aiAnalysis) {
        setStatus('Kiểm tra hoàn tất. Đang chờ chu kỳ tiếp theo.');
        const signal = response.aiAnalysis.buySellSignal || 'Không có tín hiệu';
        setLastSignal(signal);
      }
      setLastChecked(new Date().toLocaleTimeString());
    };

    // Run the first check immediately
    runCheck();

    const intervalId = setInterval(runCheck, MONITORING_INTERVAL);
    
    // Timer for progress bar
    let progressInterval: NodeJS.Timeout;

    const startProgressTimer = () => {
        setProgress(0);
        if (progressInterval) clearInterval(progressInterval);
        
        const startTime = Date.now();
        progressInterval = setInterval(() => {
            if (!isMounted) return;
            const elapsedTime = Date.now() - startTime;
            const currentProgress = Math.min(100, (elapsedTime / MONITORING_INTERVAL) * 100);
            setProgress(currentProgress);
            setNextCheck(new Date(startTime + MONITORING_INTERVAL).toLocaleTimeString());

            if (currentProgress >= 100) {
                 // The main interval will fire soon, this just resets the visual
                setTimeout(() => {
                    if (isMounted) {
                        startProgressTimer();
                    }
                }, 1000);
            }
        }, 1000);
    }
    
    startProgressTimer();

    return () => {
        isMounted = false;
        clearInterval(intervalId);
        clearInterval(progressInterval);
    };
  }, [pair, timeframe, mode, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <BellRing className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-2xl font-headline">Giám sát Tín hiệu Tự động</CardTitle>
                <CardDescription>
                Hệ thống đang tự động theo dõi tín hiệu cho bạn. Một thông báo sẽ được gửi đến Discord nếu có tín hiệu MUA hoặc BÁN.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 text-sm">
            <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                <span className="font-semibold text-muted-foreground">Cặp tiền đang theo dõi:</span>
                <span className="font-bold text-primary text-lg">{pair} ({mode})</span>
            </div>
             <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground">Trạng thái hiện tại:</p>
                    <p className="font-semibold flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" /> 
                        {status}
                    </p>
                </div>
                 <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground">Tín hiệu cuối cùng:</p>
                    <p className="font-bold">
                        {lastSignal}
                    </p>
                </div>
                 <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground">Kiểm tra lần cuối:</p>
                    <p>{lastChecked || 'Chưa có'}</p>
                </div>
                 <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground">Kiểm tra tiếp theo:</p>
                    <p>{nextCheck || 'Đang tính toán...'}</p>
                </div>
            </div>
            <div>
                 <Label className="text-xs text-muted-foreground mb-2 block">Tiến trình đến lần kiểm tra tiếp theo</Label>
                 <Progress value={progress} className="w-full h-2" />
            </div>

            <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-md">
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">Lưu ý quan trọng</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Vui lòng không đóng tab này để duy trì quá trình giám sát. Tính năng này hiện đang chạy trên trình duyệt của bạn.
                </p>
            </div>

        </CardContent>
        <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại Trang chủ và Dừng Giám sát
              </Button>
            </Link>
        </CardFooter>
      </Card>
    </main>
  );
}


export default function MonitorPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <MonitorPageContent />
        </Suspense>
    )
}
