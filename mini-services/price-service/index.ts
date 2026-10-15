// ============================================================
// Finovation Price Stream Service (socket.io, port 3003)
// Streams deterministic live quotes for all instruments every
// 1s. Math MUST stay in sync with src/lib/market.ts.
// ============================================================
import { createServer } from "http";
import { Server } from "socket.io";

// ---- instruments (keep in sync with src/lib/market.ts) ----
const INSTRUMENTS = [
  { symbol: "EURUSD", basePrice: 1.08654, spread: 0.00007, volatility: 0.8, seed: 11 },
  { symbol: "GBPUSD", basePrice: 1.26742, spread: 0.00011, volatility: 0.9, seed: 23 },
  { symbol: "USDJPY", basePrice: 151.384, spread: 0.014, volatility: 0.9, seed: 31 },
  { symbol: "AUDUSD", basePrice: 0.65421, spread: 0.00013, volatility: 1.0, seed: 41 },
  { symbol: "USDCAD", basePrice: 1.35841, spread: 0.00015, volatility: 0.8, seed: 53 },
  { symbol: "EURGBP", basePrice: 0.85712, spread: 0.00012, volatility: 0.6, seed: 61 },
  { symbol: "BTCUSD", basePrice: 67234.5, spread: 14.0, volatility: 2.2, seed: 71 },
  { symbol: "ETHUSD", basePrice: 3512.42, spread: 1.4, volatility: 2.4, seed: 83 },
  { symbol: "SOLUSD", basePrice: 172.38, spread: 0.35, volatility: 2.8, seed: 97 },
  { symbol: "XRPUSD", basePrice: 0.6238, spread: 0.0014, volatility: 2.6, seed: 101 },
  { symbol: "XAUUSD", basePrice: 2358.46, spread: 0.3, volatility: 1.2, seed: 113 },
  { symbol: "XAGUSD", basePrice: 27.842, spread: 0.024, volatility: 1.5, seed: 127 },
  { symbol: "US30", basePrice: 39452.3, spread: 2.6, volatility: 1.0, seed: 131 },
  { symbol: "NAS100", basePrice: 17845.6, spread: 1.9, volatility: 1.3, seed: 139 },
  { symbol: "US500", basePrice: 5218.44, spread: 0.55, volatility: 1.0, seed: 149 },
  { symbol: "USOIL", basePrice: 78.65, spread: 0.05, volatility: 1.6, seed: 151 },
  { symbol: "UKOIL", basePrice: 82.94, spread: 0.06, volatility: 1.5, seed: 163 },
];

function hash1(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function noise(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i + seed) * (1 - u) + hash1(i + 1 + seed) * u;
}
function midPrice(def: (typeof INSTRUMENTS)[number], t: number): number {
  const s = t / 1000;
  let drift = 0;
  drift += (noise(s / 620, def.seed) - 0.5) * 0.009 * def.volatility;
  drift += (noise(s / 95, def.seed + 7) - 0.5) * 0.0035 * def.volatility;
  drift += (noise(s / 16, def.seed + 13) - 0.5) * 0.0011 * def.volatility;
  drift += (noise(s / 2.6, def.seed + 29) - 0.5) * 0.00034 * def.volatility;
  drift += Math.sin(s / 11 + def.seed) * 0.00013 * def.volatility;
  return def.basePrice * (1 + drift);
}
function buildQuotes(t: number): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const def of INSTRUMENTS) {
    const mid = midPrice(def, t);
    out[def.symbol] = [
      Math.round((mid - def.spread / 2) * 1e5) / 1e5,
      Math.round((mid + def.spread / 2) * 1e5) / 1e5,
    ];
  }
  return out;
}

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log(`Price client connected: ${socket.id}`);
  // immediate snapshot so charts start instantly
  socket.emit("prices", { t: Date.now(), q: buildQuotes(Date.now()) });
  socket.on("disconnect", () => console.log(`Price client left: ${socket.id}`));
});

// broadcast ticks every second to everyone
setInterval(() => {
  const t = Date.now();
  io.emit("prices", { t, q: buildQuotes(t) });
}, 1000);

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`Finovation price stream running on port ${PORT}`);
});
