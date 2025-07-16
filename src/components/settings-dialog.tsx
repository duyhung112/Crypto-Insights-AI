import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const storedApiKey = localStorage.getItem('geminiApiKey') || '';
      const storedWebhookUrl = localStorage.getItem('discordWebhookUrl') || '';
      setGeminiApiKey(storedApiKey);
      setDiscordWebhookUrl(storedWebhookUrl);
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', geminiApiKey);
    localStorage.setItem('discordWebhookUrl', discordWebhookUrl);
    toast({
      title: 'Đã lưu cài đặt',
      description: 'Các thay đổi của bạn đã được lưu thành công.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cài đặt</DialogTitle>
          <DialogDescription>
            Tùy chỉnh các tích hợp và API cho ứng dụng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
             <h3 className="text-sm font-medium">Cấu hình Gemini AI</h3>
             <p className="text-xs text-muted-foreground">
                Lưu ý: Do hạn chế về kiến trúc, khóa API này hiện chỉ được lưu trên trình duyệt của bạn và chưa được sử dụng cho các yêu cầu phía máy chủ.
             </p>
            <Label htmlFor="gemini-api-key" className="sr-only">
              Gemini API Key
            </Label>
            <Input
              id="gemini-api-key"
              type="password"
              placeholder="Nhập Gemini API Key của bạn"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Thông báo Discord</h3>
            <p className="text-xs text-muted-foreground">
                Nhận thông báo về các tín hiệu giao dịch mới trực tiếp trên kênh Discord của bạn.
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
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
