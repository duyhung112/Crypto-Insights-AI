
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
  const currentPair = useRef(pair);

  useEffect(() => {
    currentPair.current = pair;
    
    // Function to connect
    const connect = () => {
      // If there's an existing WebSocket, close it before creating a new one
      if (ws.current) {
          ws.current.close();
      }

      ws.current = new WebSocket(WEBSOCKET_URL);
      const currentWs = ws.current;

      currentWs.onopen = () => {
        // Only proceed if the WebSocket instance is the current one
        if (currentWs === ws.current) {
          console.log(`WebSocket connected for ${currentPair.current}`);
          setIsConnected(true);
          // Subscribe to the ticker topic
          currentWs.send(
            JSON.stringify({
              op: "subscribe",
              args: [`tickers.${currentPair.current}`],
            })
          );
        }
      };

      currentWs.onmessage = (event) => {
        if (currentWs !== ws.current) return;
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
         if (currentWs === ws.current) {
            console.log("WebSocket disconnected");
            setIsConnected(false);
         }
      };

      currentWs.onerror = (event) => {
        console.error("Bybit WebSocket error. Event:", event);
        if (currentWs === ws.current) {
            currentWs.close();
        }
      };
    };
    
    // Reset data and connect
    setTickerData(null);
    connect();

    // Cleanup on component unmount or pair change
    return () => {
      if (ws.current) {
        console.log("Closing WebSocket connection.");
        ws.current.close();
        ws.current = null;
      }
    };
  }, [pair]); // Re-run effect when the pair changes

  return { tickerData, isConnected };
};

    