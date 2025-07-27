
"use client";

import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

interface TradingViewChartProps {
    pair: string;
    timeframe: string;
    exchange?: 'BYBIT' | 'ONUS';
}

const TradingViewChart = ({ pair, timeframe, exchange = 'BYBIT' }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { theme: appTheme, resolvedTheme } = useTheme();

  const getWidgetOptions = () => {
    const currentTheme = resolvedTheme || appTheme;
    
    // ONUS pairs might have underscores, TradingView usually doesn't like them.
    // Bybit symbols have .P for perpetuals
    const symbol = exchange === 'BYBIT' ? `BYBIT:${pair}.P` : `${exchange}:${pair}`;

     return {
        autosize: true,
        symbol: symbol,
        interval: timeframe,
        timezone: "Etc/UTC",
        theme: currentTheme === 'dark' ? 'dark' : 'light',
        style: "1",
        locale: "vi",
        enable_publishing: false,
        allow_symbol_change: true,
        details: false, 
        studies: [
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies",
            {
                id: "MovingAverageExponential@tv-basicstudies",
                inputs: {
                    length: 9
                }
            },
            {
                id: "MovingAverageExponential@tv-basicstudies",
                inputs: {
                    length: 21
                }
            },
            {
                id: "MovingAverageExponential@tv-basicstudies",
                inputs: {
                    length: 50
                },
                styles: {
                    plot: {
                        color: "#f59e0b" // a gold/yellow color
                    }
                }
            },
            {
              id: "PivotPointsStandard@tv-basicstudies",
              // Hide higher-level pivots for a cleaner chart
              styles: {
                "R3": { "visible": false },
                "R4": { "visible": false },
                "R5": { "visible": false },
                "S3": { "visible": false },
                "S4": { "visible": false },
                "S5": { "visible": false },
              }
            }
        ],
        container_id: "tradingview_container",
      };
  }

  const createWidget = () => {
    if (!containerRef.current || !(window as any).TradingView) return;

    if (widgetRef.current) {
        try {
            widgetRef.current.remove();
        } catch (e) {
            console.error("Error removing previous TradingView widget:", e);
        }
        widgetRef.current = null;
    }
    
    const widgetOptions = getWidgetOptions();
    try {
        const tvWidget = new (window as any).TradingView.widget(widgetOptions);
        widgetRef.current = tvWidget;
    } catch (error) {
        console.error("Error creating TradingView widget:", error, "with options", widgetOptions);
    }
  };

  useEffect(() => {
    if (!(window as any).tradingViewScriptLoaded) {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
         (window as any).tradingViewScriptLoaded = true;
         createWidget();
      };
      document.body.appendChild(script);
    } else {
        createWidget();
    }
    
    return () => {
        if (widgetRef.current) {
            try {
                widgetRef.current.remove();
            } catch(e) {
                // console.error("Error removing trading view widget on unmount", e)
            }
            widgetRef.current = null;
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if ((window as any).tradingViewScriptLoaded && widgetRef.current?.ready) {
       createWidget();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, timeframe, exchange]);

  useEffect(() => {
    if ((window as any).tradingViewScriptLoaded) {
        createWidget(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, appTheme]);


  return (
    <div id="tradingview_container" ref={containerRef} className="w-full h-full">
      {/* The widget will be injected here */}
    </div>
  );
};

export default memo(TradingViewChart);
