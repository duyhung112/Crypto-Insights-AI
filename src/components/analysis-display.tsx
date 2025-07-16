import type { AnalyzeCryptoPairOutput } from "@/ai/flows/analyze-crypto-pair";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface AnalysisDisplayProps {
  analysis: AnalyzeCryptoPairOutput;
}

const getSignalBadgeVariant = (signal: string) => {
  const lowerSignal = signal.toLowerCase();
  if (lowerSignal.includes("buy") || lowerSignal.includes("mua"))
    return "default";
  if (lowerSignal.includes("sell") || lowerSignal.includes("bán"))
    return "destructive";
  return "secondary";
};

const getSignalIcon = (signal: string) => {
  const lowerSignal = signal.toLowerCase();
  if (lowerSignal.includes("buy") || lowerSignal.includes("mua"))
    return <ArrowUp className="h-4 w-4 text-chart-2" />;
  if (lowerSignal.includes("sell") || lowerSignal.includes("bán"))
    return <ArrowDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex flex-wrap items-center gap-4">
          Phân tích từ AI
          <Badge
            variant={getSignalBadgeVariant(analysis.buySellSignal)}
            className="text-lg px-4 py-1"
          >
            <span className="flex items-center gap-2">
              {getSignalIcon(analysis.buySellSignal)}
              {analysis.buySellSignal}
            </span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Dưới đây là phân tích chi tiết được cung cấp bởi Gemini AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-base">
        <div className="space-y-2">
          <h3 className="font-headline text-xl font-semibold">
            Tổng quan thị trường
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {analysis.marketOverview}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-headline text-xl font-semibold">
            Diễn giải chỉ báo
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {analysis.indicatorExplanations}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Giá vào lệnh (Entry)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {analysis.entrySuggestion}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Dừng lỗ (Stop-loss)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                {analysis.stopLossSuggestion}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Chốt lời (Take-profit)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-chart-2">
                {analysis.takeProfitSuggestion}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
