// This is a new file.
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { TrendingUp, TrendingDown, Target, ShieldX, Ratio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalVisualizationProps {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  signalType: string;
}

// Helper to calculate the greatest common divisor
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export const SignalVisualization: React.FC<SignalVisualizationProps> = ({
  entryPrice,
  stopLoss,
  takeProfit,
  signalType,
}) => {
  if (!entryPrice || !stopLoss || !takeProfit) {
    return null; // Don't render if data is incomplete
  }

  const isBuySignal = signalType.toUpperCase().includes('MUA') || signalType.toUpperCase().includes('BUY');

  const potentialLoss = isBuySignal ? entryPrice - stopLoss : stopLoss - entryPrice;
  const potentialGain = isBuySignal ? takeProfit - entryPrice : entryPrice - takeProfit;

  if (potentialLoss <= 0 || potentialGain <= 0) {
    return (
        <div className="text-center text-muted-foreground text-xs py-4">
            Không thể tính toán tỷ lệ R:R. Vui lòng kiểm tra lại các mức giá.
        </div>
    );
  }

  // Simplify the ratio
  const commonDivisor = gcd(Math.round(potentialGain * 100), Math.round(potentialLoss * 100));
  const simplifiedGain = Math.round(potentialGain * 100) / commonDivisor;
  const simplifiedLoss = Math.round(potentialLoss * 100) / commonDivisor;
  const riskRewardRatio = simplifiedGain / simplifiedLoss;
  

  const lossPercentage = (potentialLoss / entryPrice) * 100;
  const gainPercentage = (potentialGain / entryPrice) * 100;

  const totalRange = potentialLoss + potentialGain;
  const lossFlex = (potentialLoss / totalRange) * 100;
  const gainFlex = (potentialGain / totalRange) * 100;
  
  return (
    <div className="space-y-4 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <Card className="bg-background/50">
                <CardHeader className="p-3">
                    <CardDescription className="flex items-center justify-center gap-2 text-xs">
                        <TrendingUp className="h-4 w-4 text-primary" /> Vào lệnh
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                     <p className="text-base font-bold font-mono text-foreground">{entryPrice.toLocaleString()}</p>
                </CardContent>
            </Card>
             <Card className="bg-background/50">
                <CardHeader className="p-3">
                    <CardDescription className="flex items-center justify-center gap-2 text-xs">
                        <ShieldX className="h-4 w-4 text-destructive" /> Dừng lỗ
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                     <p className="text-base font-bold font-mono text-destructive">{stopLoss.toLocaleString()}</p>
                </CardContent>
            </Card>
             <Card className="bg-background/50">
                <CardHeader className="p-3">
                    <CardDescription className="flex items-center justify-center gap-2 text-xs">
                       <Target className="h-4 w-4 text-green-500" /> Chốt lời
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                     <p className="text-base font-bold font-mono text-green-500">{takeProfit.toLocaleString()}</p>
                </CardContent>
            </Card>
        </div>

        <div className="pt-2">
            <div className="flex items-center justify-between mb-1 text-xs text-muted-foreground px-1">
                <span>Rủi ro ({lossPercentage.toFixed(2)}%)</span>
                <span>Lợi nhuận ({gainPercentage.toFixed(2)}%)</span>
            </div>
            <div className="flex h-8 w-full rounded-md overflow-hidden">
                <div 
                    className="flex items-center justify-center bg-red-500/30 text-red-100 font-semibold" 
                    style={{ flexGrow: lossFlex }}
                >
                    {isBuySignal ? 'SL' : 'TP'}
                </div>
                <div 
                    className="flex items-center justify-center bg-green-500/30 text-green-100 font-semibold" 
                    style={{ flexGrow: gainFlex }}
                >
                     {isBuySignal ? 'TP' : 'SL'}
                </div>
            </div>
             <div className="flex items-center justify-center gap-2 mt-3 text-sm">
                <Ratio className="h-4 w-4 text-muted-foreground"/>
                <span className="text-muted-foreground">Tỷ lệ R:R:</span>
                <span className={cn(
                    "font-bold font-mono",
                    riskRewardRatio >= 2 ? "text-green-500" : riskRewardRatio >= 1 ? "text-yellow-500" : "text-red-500"
                )}>
                   1 : {riskRewardRatio.toFixed(2)}
                </span>
            </div>
        </div>
    </div>
  );
};
