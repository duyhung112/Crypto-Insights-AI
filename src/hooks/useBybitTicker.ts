import { useState, useEffect, useRef } from 'react';

const WEBSOCKET_URL = "wss://stream.bybit.com/v5/public/linear";

export interface TickerData {
  lastPrice: string;
  highPrice24h: string;
  lowPrice24h: string;
  openPrice24h: string;
  price24hPcnt: string;
  turnover24h: string;
  volume24h: string;
}

export const useBybitTicker = (pair: string) => {
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Function to connect
    const connect = () => {
      ws.current = new WebSocket(WEBSOCKET_URL);

      ws.current.onopen = () => {
        console.log(`WebSocket connected for ${pair}`);
        setIsConnected(true);
        // Subscribe to the ticker topic
        ws.current?.send(
          JSON.stringify({
            op: "subscribe",
            args: [`tickers.${pair}`],
          })
        );
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.topic && message.topic.startsWith('tickers.')) {
            if (message.data) {
                const data = message.data;
                const newTickerData: TickerData = {
                    lastPrice: data.lastPrice,
                    highPrice24h: data.highPrice24h,
                    lowPrice24h: data.lowPrice24h,
                    openPrice24h: data.markPrice, // No open price, using mark price as a proxy
                    price24hPcnt: data.price24hPcnt,
                    turnover24h: data.turnover24h,
                    volume24h: data.volume24h
                }
                setTickerData(newTickerData);
            }
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      };

      ws.current.onerror = (event) => {
        console.error("Bybit WebSocket error. Event:", event);
        ws.current?.close();
      };
    };

    // Close previous connection if it exists before creating a new one
    if (ws.current) {
        ws.current.close();
    }
    
    // Reset data and connect
    setTickerData(null);
    connect();

    // Cleanup on component unmount or pair change
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection.");
        ws.current.close();
      }
      ws.current = null;
    };
  }, [pair]); // Re-run effect when the pair changes

  return { tickerData, isConnected };
};
