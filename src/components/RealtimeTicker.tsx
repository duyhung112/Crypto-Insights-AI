import React from 'react';
import { useBybitTicker } from '@/hooks/useBybitTicker';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface RealtimeTickerProps {
  pair: string;
}

const formatNumber = (numStr: string | undefined, options?: Intl.NumberFormatOptions) => {
    if (!numStr) return <Skeleton className="h-5 w-24" />;
    const num = parseFloat(numStr);
    if (isNaN(num)) return <Skeleton className="h-5 w-24" />;
    return new Intl.NumberFormat('en-US', options).format(num);
}

const TickerValue: React.FC<{label: string, value: React.ReactNode, valueClassName?: string}> = ({ label, value, valueClassName }) => (
    <div className="flex flex-col items-center justify-center p-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-semibold", valueClassName)}>{value}</span>
    </div>
);


export const RealtimeTicker: React.FC<RealtimeTickerProps> = ({ pair }) => {
  const { tickerData, isConnected } = useBybitTicker(pair);

  const priceChange = parseFloat(tickerData?.price24hPcnt || '0');
  const priceChangeColor = priceChange > 0 ? 'text-green-500' : priceChange < 0 ? 'text-red-500' : 'text-foreground';
  const priceChangeFormatted = tickerData ? `${(priceChange * 100).toFixed(2)}%` : '0.00%';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x border rounded-lg mb-4">
      <TickerValue 
        label="Giá Hiện Tại"
        value={formatNumber(tickerData?.lastPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        valueClassName={cn("text-lg", priceChangeColor)}
      />
      <TickerValue 
        label="Thay đổi 24h"
        value={tickerData ? priceChangeFormatted : <Skeleton className="h-5 w-16" />}
        valueClassName={priceChangeColor}
      />
      <TickerValue 
        label="Cao 24h"
        value={formatNumber(tickerData?.highPrice24h, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      />
       <TickerValue 
        label="Thấp 24h"
        value={formatNumber(tickerData?.lowPrice24h, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      />
       <TickerValue 
        label="KLg (USDT)"
        value={formatNumber(tickerData?.turnover24h)}
      />
       <TickerValue 
        label="KLg (Coin)"
        value={formatNumber(tickerData?.volume24h)}
      />
    </div>
  );
};
