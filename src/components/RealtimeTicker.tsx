import React, { useState, useEffect, useRef } from 'react';
import { useBybitTicker } from '@/hooks/useBybitTicker';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface RealtimeTickerProps {
  pair: string;
}

const formatNumber = (numStr: string | undefined, options?: Intl.NumberFormatOptions) => {
    if (!numStr) return '...'; 
    const num = parseFloat(numStr);
    if (isNaN(num)) return '...';
    return new Intl.NumberFormat('en-US', options).format(num);
}

const TickerValue: React.FC<{
  label: string, 
  value: React.ReactNode, 
  valueClassName?: string, 
  containerClassName?: string,
  animationClassName?: string,
  loading: boolean
}> = ({ label, value, valueClassName, containerClassName, animationClassName, loading }) => (
    <div className={cn("flex flex-col items-center justify-center p-2 text-center", containerClassName)}>
        <span className="text-xs text-muted-foreground">{label}</span>
        {loading ? (
            <Skeleton className="h-5 w-20 mt-1" />
        ) : (
             <div className={cn("relative rounded-md", animationClassName)}>
                <span className={cn("text-sm font-semibold font-mono tabular-nums", valueClassName)}>{value}</span>
             </div>
        )}
    </div>
);


export const RealtimeTicker: React.FC<RealtimeTickerProps> = ({ pair }) => {
  const { tickerData, isConnected } = useBybitTicker(pair);
  const isLoading = !tickerData && isConnected;

  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<string | undefined>();

  useEffect(() => {
    if (tickerData?.lastPrice) {
      if (prevPriceRef.current && prevPriceRef.current !== tickerData.lastPrice) {
        if (parseFloat(tickerData.lastPrice) > parseFloat(prevPriceRef.current)) {
          setPriceDirection('up');
        } else {
          setPriceDirection('down');
        }
      }
      prevPriceRef.current = tickerData.lastPrice;
    }
  }, [tickerData?.lastPrice]);


  const priceChange = parseFloat(tickerData?.price24hPcnt || '0');
  const priceChangeColor = priceChange > 0 ? 'text-green-500' : priceChange < 0 ? 'text-red-500' : 'text-foreground';
  const priceChangeFormatted = tickerData ? `${(priceChange * 100).toFixed(2)}%` : '0.00%';

  const getAnimationClass = () => {
    if (!priceDirection) return '';
    const animationClass = priceDirection === 'up' 
        ? 'animate-flash-up' 
        : 'animate-flash-down';
    return animationClass;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x border rounded-lg mb-4">
      <TickerValue 
        label="Giá Hiện Tại"
        loading={isLoading}
        value={formatNumber(tickerData?.lastPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        valueClassName={cn("text-lg", priceChangeColor)}
        animationClassName={getAnimationClass()}
        containerClassName="transition-colors duration-300"
      />
      <TickerValue 
        label="Thay đổi 24h"
        loading={isLoading}
        value={priceChangeFormatted}
        valueClassName={priceChangeColor}
      />
      <TickerValue 
        label="Cao 24h"
        loading={isLoading}
        value={formatNumber(tickerData?.highPrice24h, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      />
       <TickerValue 
        label="Thấp 24h"
        loading={isLoading}
        value={formatNumber(tickerData?.lowPrice24h, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      />
       <TickerValue 
        label="KLg (USDT)"
        loading={isLoading}
        value={formatNumber(tickerData?.turnover24h)}
      />
       <TickerValue 
        label="KLg (Coin)"
        loading={isLoading}
        value={formatNumber(tickerData?.volume24h)}
      />
    </div>
  );
};
