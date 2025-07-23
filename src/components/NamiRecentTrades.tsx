
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface NamiTrade {
  S: 'BUY' | 'SELL';
  p: number;
  q: number;
  s: string;
  t: number;
}

export function NamiRecentTrades() {
  const [trades, setTrades] = useState<NamiTrade[]>([]);

  useEffect(() => {
    const socket = io("https://stream-asia2.nami.exchange", {
      path: "/ws",
      upgrade: false,
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
      reconnectionAttempts: Infinity,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Connected to Nami WebSocket for recent trades");
      socket.emit("subscribe:recent_trade", "BTCVNDC");
    });

    socket.on("spot:recent_trade:add", (data) => {
      setTrades(prev => {
        const updated = [data, ...prev];
        return updated.slice(0, 30); // Giữ 30 giao dịch gần nhất
      });
    });

    return () => {
      console.log("❌ Disconnecting from Nami WebSocket for recent trades");
      socket.disconnect();
    };
  }, []);

  return (
    <Card>
        <CardHeader className='p-4'>
            <CardTitle className="text-base font-medium">Giao dịch BTC/VNDC Realtime</CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0'>
            <ScrollArea className="h-[200px] w-full pr-4">
                 <ul className="space-y-1 text-xs font-mono">
                    {trades.map((trade, index) => (
                    <li
                        key={index}
                        className={`flex justify-between px-2 py-1 rounded `}
                    >
                        <span className={`${
                            trade.S === "BUY" ? "text-green-500" : "text-red-500"
                            }`}>
                            {trade.S}
                        </span>
                        <span>{trade.q.toFixed(5)}</span>
                        <span>@ {trade.p.toLocaleString()}</span>
                        <span className='text-muted-foreground'>{new Date(trade.t).toLocaleTimeString()}</span>
                    </li>
                    ))}
                </ul>
                {trades.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Đang chờ dữ liệu giao dịch...
                    </div>
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
