
"use client";

import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

interface TradingViewChartProps {
    pair: string;
    timeframe: string;
}

const TradingViewChart = ({ pair, timeframe }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { theme: appTheme, resolvedTheme } = useTheme();

  const getWidgetOptions = () => {
    const currentTheme = resolvedTheme || appTheme;
     return {
        autosize: true,
        symbol: `BYBIT:${pair}.P`,
        interval: timeframe,
        timezone: "Etc/UTC",
        theme: currentTheme === 'dark' ? 'dark' : 'light',
        style: "1",
        locale: "vi",
        enable_publishing: false,
        allow_symbol_change: true,
        details: false, // Tắt thông tin chi tiết mặc định
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
              styles: {
                // P, R1, R2, S1, S2 are visible by default
                "R3": { visible: false },
                "R4": { visible: false },
                "R5": { visible: false },
                "S3": { visible: false },
                "S4": { visible: false },
                "S5": { visible: false },
              }
            }
        ],
        container_id: "tradingview_container",
      };
  }

  const createWidget = () => {
    if (!containerRef.current || !(window as any).TradingView) return;

    // Clean up previous widget if it exists
    if (widgetRef.current) {
        try {
            widgetRef.current.remove();
        } catch (e) {
            console.error("Error removing previous TradingView widget:", e);
        }
        widgetRef.current = null;
    }
    
    // Create new widget
    const widgetOptions = getWidgetOptions();
    const tvWidget = new (window as any).TradingView.widget(widgetOptions);
    widgetRef.current = tvWidget;
  };

  // Effect to load script and create initial widget
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
  }, []); 

  // Effect to update symbol when pair or timeframe changes
  useEffect(() => {
    if ((window as any).tradingViewScriptLoaded && widgetRef.current?.ready) {
       createWidget();
    }
  }, [pair, timeframe]);

  // Effect to update theme
  useEffect(() => {
    if ((window as any).tradingViewScriptLoaded) {
        createWidget(); // Recreate widget with the new theme
    }
  }, [resolvedTheme, appTheme]);


  return (
    <div id="tradingview_container" ref={containerRef} className="w-full h-full">
      {/* The widget will be injected here */}
    </div>
  );
};

export default memo(TradingViewChart);
