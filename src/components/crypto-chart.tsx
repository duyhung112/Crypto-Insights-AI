"use client";

import {
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  DeepPartial,
  ChartOptions,
  CandlestickData,
  CandlestickSeriesOptions,
  LineStyle,
} from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";
import type { KlineData } from "@/lib/types";

const getCssVariable = (variable: string) => {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

interface CryptoChartProps {
  data: KlineData[];
}

const CryptoChart: React.FC<CryptoChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !chartContainerRef.current || data.length === 0) return;

    const foreground = `hsl(${getCssVariable("--foreground")})`;
    const background = `hsl(${getCssVariable("--background")})`;
    const gridColor = `hsl(${getCssVariable("--border")})`;
    const upColor = `hsl(${getCssVariable("--chart-2")})`;
    const downColor = `hsl(${getCssVariable("--destructive")})`;

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background: { color: "transparent" },
        textColor: foreground,
      },
      grid: {
        vertLines: { color: gridColor, style: LineStyle.Dotted },
        horzLines: { color: gridColor, style: LineStyle.Dotted },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: gridColor,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      crosshair: {
        mode: 1,
      },
    };

    const candlestickSeriesOptions: DeepPartial<CandlestickSeriesOptions> = {
      upColor,
      downColor,
      borderDownColor: downColor,
      borderUpColor: upColor,
      wickDownColor: downColor,
      wickUpColor: upColor,
    };

    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, chartOptions);
      candlestickSeriesRef.current = chartRef.current.addCandlestickSeries(candlestickSeriesOptions);
    } else {
      chartRef.current.applyOptions(chartOptions);
      candlestickSeriesRef.current?.applyOptions(candlestickSeriesOptions);
    }

    const candlestickData: CandlestickData[] = data.map((d) => ({
      time: d.time as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeriesRef.current?.setData(candlestickData);
    chartRef.current.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        );
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, isClient]);

  return <div ref={chartContainerRef} className="w-full h-[400px] md:h-[500px]" />;
};

export default CryptoChart;
