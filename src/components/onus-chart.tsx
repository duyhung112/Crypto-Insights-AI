
"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import type { KlineData } from '@/lib/types';

interface OnusChartProps {
  data: KlineData[];
}

const OnusChart: React.FC<OnusChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
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
        time: (item.time / 1000) as Time, // Lightweight-charts expects seconds
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      candlestickSeriesRef.current.setData(formattedData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default OnusChart;
