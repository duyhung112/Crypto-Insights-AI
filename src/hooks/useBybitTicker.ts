
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
    // If there's an existing WebSocket, close it before creating a new one
    if (ws.current) {
        ws.current.close();
    }
    
    // Reset data for the new pair
    setTickerData(null);

    ws.current = new WebSocket(WEBSOCKET_URL);
    const currentWs = ws.current;

    currentWs.onopen = () => {
      console.log(`WebSocket connected for ${pair}`);
      setIsConnected(true);
      // Subscribe to the ticker topic for the current pair
      currentWs.send(
        JSON.stringify({
          op: "subscribe",
          args: [`tickers.${pair}`],
        })
      );
    };

    currentWs.onmessage = (event) => {
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

    currentWs.onclose = () => {
       console.log("WebSocket disconnected");
       setIsConnected(false);
    };

    currentWs.onerror = (event) => {
      console.error("Bybit WebSocket error. Event:", event);
      currentWs.close();
    };

    // Cleanup on component unmount or pair change
    return () => {
      if (currentWs) {
        console.log("Closing WebSocket connection.");
        currentWs.close();
      }
    };
  }, [pair]); // Re-run effect when the pair changes

  return { tickerData, isConnected };
};

    

    