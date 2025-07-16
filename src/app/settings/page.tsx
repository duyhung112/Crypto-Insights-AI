// This is a new file.
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem('geminiApiKey') || '';
    const storedWebhookUrl = localStorage.getItem('discordWebhookUrl') || '';
    setGeminiApiKey(storedApiKey);
    setDiscordWebhookUrl(storedWebhookUrl);
  }, []);

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', geminiApiKey);
    localStorage.setItem('discordWebhookUrl', discordWebhookUrl);
    toast({
      title: 'Đã lưu cài đặt',
      description: 'Các thay đổi của bạn đã được lưu thành công vào bộ nhớ cục bộ của trình duyệt.',
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Cài đặt</CardTitle>
          <CardDescription>
            Quản lý cấu hình API và các tích hợp cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="space-y-2">
             <h3 className="text-lg font-semibold">Cấu hình Gemini AI</h3>
             <p className="text-sm text-muted-foreground">
                Nhập API Key của bạn từ Google AI Studio. Key này sẽ được lưu trữ an toàn trên trình duyệt của bạn.
             </p>
            <Label htmlFor="gemini-api-key" className="sr-only">
              Gemini API Key
            </Label>
            <Input
              id="gemini-api-key"
              type="password"
              placeholder="Nhập Gemini API Key của bạn (ví dụ: AIza...)"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Thông báo Discord</h3>
            <p className="text-sm text-muted-foreground">
                Nhận thông báo về các tín hiệu giao dịch mới trực tiếp trên kênh Discord của bạn bằng cách cung cấp một Webhook URL.
            </p>
            <Label htmlFor="discord-webhook-url" className="sr-only">
              Discord Webhook URL
            </Label>
            <Input
              id="discord-webhook-url"
              placeholder="Nhập Discord Webhook URL"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại Trang chủ
              </Button>
            </Link>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
