// components/tradingview-chart.tsx
"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
    pair: string;
    timeframe: string;
}

const TradingViewChart = ({ pair, timeframe }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const createWidget = () => {
      if (containerRef.current && !widgetRef.current && (window as any).TradingView) {
        const widgetOptions = {
          autosize: true,
          symbol: `BYBIT:${pair}`,
          interval: timeframe,
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "vi_VN",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
        };
        const tvWidget = new (window as any).TradingView.widget(widgetOptions);
        widgetRef.current = tvWidget;
      }
    };

    if (!(window as any).TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = createWidget;
      document.body.appendChild(script);
    } else {
      createWidget();
    }

    return () => {
      if (widgetRef.current) {
        try {
            widgetRef.current.remove();
        } catch(e) {
            console.error("Error removing trading view widget", e)
        }
        widgetRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (widgetRef.current && widgetRef.current.ready) {
      widgetRef.current.setSymbol(`BYBIT:${pair}`, timeframe, () => {
        // console.log("Symbol changed");
      });
    }
  }, [pair, timeframe]);

  return (
    <div id="tradingview_container" ref={containerRef} className="w-full h-full">
      {/* The widget will be injected here */}
    </div>
  );
};

export default memo(TradingViewChart);