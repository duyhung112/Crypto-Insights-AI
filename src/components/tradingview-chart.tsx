// components/TradingViewWidget.tsx
"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
    pair: string;
    timeframe: string;
}

function TradingViewChart({ pair, timeframe }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const isWidgetCreated = useRef(false);

  useEffect(() => {
    if (!container.current || isWidgetCreated.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
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
            container_id: container.current?.id
        });
        isWidgetCreated.current = true;
      }
    };
    
    document.body.appendChild(script);

    return () => {
        // Clean up the script when the component unmounts
        if(document.body.contains(script)){
            document.body.removeChild(script);
        }
    }

  }, []); // Run only once

  useEffect(() => {
    if (container.current?.querySelector('iframe')) {
        const widget = new (window as any).TradingView.widget({
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
            container_id: container.current?.id
        });
    }
  }, [pair, timeframe])

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div id={`tradingview_widget_${pair}_${timeframe}`} style={{ height: "calc(100% - 32px)", width: "100%" }} />
      <div className="tradingview-widget-copyright">
        <a href="https://vn.tradingview.com/" rel="noopener nofollow" target="_blank">
            <span className="blue-text">Theo dõi tất cả các thị trường trên TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewChart);
