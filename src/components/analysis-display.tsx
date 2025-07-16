import type { AnalyzeCryptoPairOutput } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus, ShieldCheck } from "lucide-react";
import { Separator } from "./ui/separator";

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
          AI Expert Analysis
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
          Below is a detailed analysis provided by Gemini AI based on technical indicators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-base">
        <div className="space-y-2">
          <h3 className="font-headline text-xl font-semibold">
            Market Overview
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {analysis.marketOverview}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-headline text-xl font-semibold">
            Indicator Explanations
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {analysis.indicatorExplanations}
          </p>
        </div>

        <Separator />
        
        <div className="space-y-4">
            <h3 className="font-headline text-xl font-semibold">
                Proposed Trading Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card>
                <CardHeader className="p-4">
                    <CardDescription>Entry Price</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold text-primary">
                        {analysis.entrySuggestion}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="p-4">
                    <CardDescription>Stop-loss</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold text-destructive">
                        {analysis.stopLossSuggestion}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="p-4">
                    <CardDescription>Take-profit</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold text-chart-2">
                        {analysis.takeProfitSuggestion}
                    </p>
                </CardContent>
            </Card>
            </div>
        </div>

         <Card className="bg-muted/50 border-primary/50">
            <CardHeader className="flex flex-row items-start gap-4">
                <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                    <CardTitle className="text-lg font-semibold font-headline text-primary">
                        Risk Management Advice
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/90 whitespace-pre-wrap pt-2">
                        {analysis.riskManagementAdvice}
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>

      </CardContent>
    </Card>
  );
}
