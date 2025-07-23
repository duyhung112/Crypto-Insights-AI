
"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type Time, type UTCTimestamp } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import type { KlineData } from '@/lib/types';
import { io } from 'socket.io-client';

interface NamiChartProps {
  data: KlineData[];
  pair: string;
}

const NamiChart: React.FC<NamiChartProps> = ({ data, pair }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF' },
        textColor: resolvedTheme === 'dark' ? '#D1D5DB' : '#1F2937',
      },
      grid: {
        vertLines: { color: resolvedTheme === 'dark' ? '#334155' : '#E5E7EB' },
        horzLines: { color: resolvedTheme === 'dark' ? '#334155' : '#E5E7EB' },
      },
      timeScale: {
        borderColor: resolvedTheme === 'dark' ? '#475569' : '#D1D5DB',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#22C55E',
      wickDownColor: '#EF4444',
      wickUpColor: '#22C55E',
    });

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 600);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
    };
  }, [resolvedTheme]);


  useEffect(() => {
     if (resolvedTheme && chartRef.current) {
        chartRef.current.applyOptions({
            layout: {
                background: { color: resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF' },
                textColor: resolvedTheme === 'dark' ? '#D1D5DB' : '#1F2937',
            },
            grid: {
                vertLines: { color: resolvedTheme === 'dark' ? '#334155' : '#E5E7EB' },
                horzLines: { color: resolvedTheme === 'dark' ? '#334155' : '#E5E7EB' },
            },
        });
    }
  }, [resolvedTheme]);


  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      const formattedData: CandlestickData<Time>[] = data.map(item => ({
        time: (item.time / 1000) as Time, 
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      candlestickSeriesRef.current.setData(formattedData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

   useEffect(() => {
    if (!pair || !candlestickSeriesRef.current) return;
    
    const socket = io("https://stream-asia2.nami.exchange", {
      path: "/ws",
      upgrade: false,
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
      reconnectionAttempts: Infinity,
      transports: ["websocket"],
    });

    const channel = `subscribe:recent_trade`;
    const socketPair = pair.replace('/', '');

    socket.on("connect", () => {
      console.log(`✅ Connected to Nami WebSocket for real-time chart updates on ${socketPair}`);
      socket.emit(channel, socketPair);
    });

    socket.on("spot:recent_trade:add", (trade) => {
      try {
        const lastCandle = data.length > 0 ? data[data.length - 1] : null;
        
        const price = Number(trade.p);
        const timestamp = Number(trade.t);

        if (isNaN(price) || isNaN(timestamp) || !lastCandle) {
          console.warn("❌ Skipping invalid trade data:", trade);
          return;
        }

        if (candlestickSeriesRef.current) {
            const newCandle: CandlestickData<Time> = {
                time: lastCandle.time / 1000 as UTCTimestamp,
                open: lastCandle.open,
                high: Math.max(lastCandle.high, price),
                low: Math.min(lastCandle.low, price),
                close: price,
            };
            candlestickSeriesRef.current.update(newCandle);
        }
      } catch (error) {
        console.error("❌ Error processing trade data:", error, trade);
      }
    });
    
    return () => {
      console.log(`❌ Disconnecting from Nami WebSocket for ${socketPair}`);
      socket.disconnect();
    };

  }, [pair, data]); // Rerun when pair changes or historical data reloads

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default NamiChart;
