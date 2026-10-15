"use client";

// ============================================================
// MarketProvider - live quotes via socket.io (price-service:3003)
// Seeds initial quotes deterministically so the UI is never empty.
// ============================================================
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { quoteAll } from "@/lib/market";

export interface LiveQuote {
  bid: number;
  ask: number;
  prevBid: number;
}

interface MarketCtx {
  quotes: Record<string, LiveQuote>;
  connected: boolean;
}

const Ctx = createContext<MarketCtx>({ quotes: {}, connected: false });

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>(() => {
    const seed: Record<string, LiveQuote> = {};
    const t = Date.now();
    for (const [sym, q] of Object.entries(quoteAll(t))) {
      seed[sym] = { bid: q.bid, ask: q.ask, prevBid: q.bid };
    }
    return seed;
  });
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const s = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
      timeout: 10000,
    });
    socketRef.current = s;

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("prices", (msg: { t: number; q: Record<string, [number, number]> }) => {
      setQuotes((prev) => {
        const next: Record<string, LiveQuote> = { ...prev };
        for (const [sym, [bid, ask]] of Object.entries(msg.q)) {
          next[sym] = { bid, ask, prevBid: prev[sym]?.bid ?? bid };
        }
        return next;
      });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return <Ctx.Provider value={{ quotes, connected }}>{children}</Ctx.Provider>;
}

export const useMarket = () => useContext(Ctx);
