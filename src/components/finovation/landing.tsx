"use client";

// ============================================================
// Finovation Landing Page — "Midnight & Gold" premium edition
// Hero + live ticker tape, live markets grid with sparklines,
// features, account types, steps, CTA, sticky footer.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "./market-context";
import { Logo, PriceFlash, ChangeBadge, Sparkline } from "./ui-bits";
import AnimatedBackground from "./animated-bg";
import { INSTRUMENTS, changePct, getInstrument, fmtPrice } from "@/lib/market";
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Percent,
  Clock,
  Headset,
  Wallet,
  LineChart,
  Lock,
  BadgeCheck,
  ChevronRight,
  Activity,
  Star,
} from "lucide-react";

const HERO_SYMBOLS = ["EURUSD", "XAUUSD", "BTCUSD", "GBPUSD", "ETHUSD", "US30"];

/** Scrolling live price ticker under the hero. */
function TickerTape() {
  const { quotes } = useMarket();
  const items = useMemo(() => INSTRUMENTS.slice(0, 14), []);
  const row = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center" aria-hidden={keyPrefix === "b"}>
      {items.map((def) => {
        const q = quotes[def.symbol];
        const pct = changePct(def.symbol, Date.now());
        const up = pct >= 0;
        return (
          <div key={keyPrefix + def.symbol} className="flex items-center gap-2 px-5">
            <span className="text-xs font-bold text-foreground/90">{def.symbol}</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {(q?.bid ?? def.basePrice).toFixed(def.digits)}
            </span>
            <span className={`font-mono text-[11px] font-semibold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-card/40 py-2.5" aria-label="Live market ticker">
      <div className="animate-ticker flex w-max">
        {row("a")}
        {row("b")}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

export default function Landing({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const { quotes, connected } = useMarket();
  const [spark, setSpark] = useState<Record<string, number[]>>({});
  const historyRef = useRef<Record<string, number[]>>({});

  // collect price history for sparklines
  useEffect(() => {
    const id = setInterval(() => {
      const h = historyRef.current;
      for (const def of INSTRUMENTS.slice(0, 12)) {
        const q = quotes[def.symbol];
        if (!q) continue;
        const arr = h[def.symbol] ?? (h[def.symbol] = []);
        arr.push(q.bid);
        if (arr.length > 40) arr.shift();
      }
      setSpark({ ...h });
    }, 1500);
    return () => clearInterval(id);
  }, [quotes]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ---------- Topbar ---------- */}
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Site navigation">
            <a href="#markets" className="transition-colors hover:text-foreground">Markets</a>
            <a href="#features" className="transition-colors hover:text-foreground">Why Finovation</a>
            <a href="#accounts" className="transition-colors hover:text-foreground">Account types</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={onLogin}>Sign in</Button>
            <Button onClick={onRegister} className="font-bold shadow-lg shadow-primary/25">Open Account</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          {/* backdrop: animated candlestick canvas + aurora orbs + grid */}
          <AnimatedBackground variant="hero" seedPrice={quotes.EURUSD?.bid} />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.3]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 100%)",
            }}
          />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="space-y-7">
              <Badge variant="outline" className="animate-fade-up gap-2 border-primary/30 bg-primary/5 px-3 py-1.5 text-primary">
                <Activity className="h-3.5 w-3.5" />
                {connected ? "Live market prices streaming now" : "Connecting to market feed..."}
              </Badge>
              <h1 className="animate-fade-up delay-1 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                Trade global markets
                <br />
                with{" "}
                <span className="text-gold-shimmer">precision</span>
              </h1>
              <p className="animate-fade-up delay-2 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Forex, crypto, metals, indices and energy — all in one platform. Instant deposits,
                lightning-fast withdrawals and spreads from 0.0 pips on Finovation.
              </p>
              <div className="animate-fade-up delay-3 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={onRegister} className="h-12 px-7 text-base font-bold shadow-xl shadow-primary/25">
                  Start trading <ArrowRight className="ml-1 h-4.5 w-4.5" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLogin} className="h-12 border-border/70 bg-card/50 px-7 text-base backdrop-blur">
                  Sign in to your account
                </Button>
              </div>
              <div className="animate-fade-up delay-4 flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Licensed &amp; secure</span>
                <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Instant withdrawals</span>
                <span className="inline-flex items-center gap-1.5"><Percent className="h-4 w-4 text-primary" /> Zero deposit fees</span>
              </div>
            </div>

            {/* Live market widget */}
            <div className="animate-fade-up delay-2 relative">
              <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/10 blur-2xl" />
              <Card className="relative z-10 border-border/70 bg-card/90 shadow-2xl shadow-black/50 backdrop-blur">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <LineChart className="h-4 w-4 text-primary" /> Market watch
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-400" : "bg-amber-400"}`} />
                    {connected ? "LIVE" : "CONNECTING"}
                  </span>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {HERO_SYMBOLS.map((sym) => {
                      const def = getInstrument(sym);
                      const q = quotes[sym];
                      const pct = changePct(sym, Date.now());
                      return (
                        <div key={sym} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/40">
                          <div>
                            <div className="text-sm font-bold">{sym}</div>
                            <div className="text-xs text-muted-foreground">{def?.name}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Sparkline data={spark[sym] ?? []} width={72} height={26} />
                            <PriceFlash
                              value={q?.bid ?? 0}
                              prev={q?.prevBid ?? 0}
                              digits={def?.digits ?? 2}
                              className="w-20 text-right text-sm font-semibold"
                            />
                            <ChangeBadge pct={pct} className="w-[5.4rem] justify-center" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-3.5">
                    <Button className="w-full font-bold shadow-lg shadow-primary/20" onClick={onRegister}>
                      Open live account — free
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* floating chips */}
              <div className="animate-float absolute -right-3 -top-6 z-20 hidden rounded-xl border border-primary/30 bg-card/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
                <div className="text-xs text-muted-foreground">BTCUSD profit</div>
                <div className="font-mono text-lg font-bold tabular-nums text-emerald-400">+$2,845.10</div>
              </div>
              <div className="animate-float absolute -bottom-6 -left-3 z-20 hidden rounded-xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur [animation-delay:1.2s] sm:block">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <BadgeCheck className="h-4 w-4 text-primary" /> Withdrawal approved
                </div>
                <div className="mt-0.5 font-mono text-sm tabular-nums">+$1,200.00 · 2s ago</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Live ticker tape ---------- */}
        <TickerTape />

        {/* ---------- Stats strip ---------- */}
        <section className="border-b border-border/60 bg-card/30">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-4 py-9 sm:px-6 lg:grid-cols-4">
            {[
              ["700K+", "Active traders worldwide"],
              ["$4.5T", "Monthly trading volume"],
              ["120+", "Instruments across 5 classes"],
              ["24/7", "Human customer support"],
            ].map(([v, l], i) => (
              <div key={l} className={`relative text-center lg:text-left ${i > 0 ? "lg:before:absolute lg:before:-left-3 lg:before:top-1 lg:before:h-10 lg:before:w-px lg:before:bg-border/70" : ""}`}>
                <div className="bg-gradient-to-br from-amber-200 to-amber-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">{v}</div>
                <div className="mt-1 text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Markets ---------- */}
        <MarketsSection quotes={quotes} spark={spark} onRegister={onRegister} />

        {/* ---------- Features ---------- */}
        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Why Finovation</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Built for serious traders,<br className="hidden sm:block" /> loved by beginners</h2>
            <p className="mt-3 text-muted-foreground">
              Institutional-grade infrastructure and trader-first policies — from your first deposit to your millionth trade.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [Zap, "Instant withdrawals", "Most withdrawals are processed in seconds, 24/7 — including weekends. Your money, your rules."],
              [Wallet, "Zero deposit fees", "Fund your account via cards, e-wallets or crypto with no fees from us. 50% welcome bonus on your first deposit."],
              [Percent, "Spreads from 0.0 pips", "Raw institutional pricing with deep liquidity across FX, metals and crypto — plus leverage up to 1:2000."],
              [ShieldCheck, "Bank-grade security", "Segmented client funds, 256-bit encryption and mandatory KYC keep your capital protected at all times."],
              [Lock, "Negative balance protection", "Your risk is capped at your deposit. You can never lose more than you fund — guaranteed."],
              [Headset, "24/7 human support", "Real people, real answers — in your language, around the clock, every day of the year."],
            ].map(([Icon, title, desc], i) => {
              const I = Icon as typeof Zap;
              return (
                <Card
                  key={title as string}
                  className={`group animate-fade-up border-border/60 bg-card/50 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-xl hover:shadow-primary/5 delay-${(i % 3) + 1}`}
                >
                  <CardContent className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/20 to-amber-600/10 text-primary ring-1 ring-primary/25 transition-transform duration-300 group-hover:scale-110">
                      <I className="h-5.5 w-5.5" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{title as string}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc as string}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ---------- Account types ---------- */}
        <section id="accounts" className="border-y border-border/60 bg-card/30 py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Account types</Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Pick the account that fits you</h2>
              <p className="mt-3 text-muted-foreground">Create additional accounts anytime from your Personal Area.</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <AccountCard
                name="Standard"
                tag="Great for beginners"
                popular={false}
                features={["Spread from 0.3 pips", "Leverage up to 1:2000", "Zero commission", "Minimum deposit $10"]}
                onRegister={onRegister}
              />
              <AccountCard
                name="Pro"
                tag="Most popular"
                popular={true}
                features={["Spread from 0.1 pips", "Leverage up to 1:1000", "Zero commission", "One-click trading"]}
                onRegister={onRegister}
              />
              <AccountCard
                name="Zero"
                tag="Built for scalpers"
                popular={false}
                features={["Spread from 0.0 pips", "Leverage up to 1:1000", "Low fixed commission", "Ultra-fast execution"]}
                onRegister={onRegister}
              />
            </div>
          </div>
        </section>

        {/* ---------- Testimonials ---------- */}
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Trader stories</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Trusted by traders like you</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Ayesha F.", "Dubai, UAE", "Withdrawals land in minutes — I've never waited more than a coffee break. The gold-accented terminal feels premium and the pricing is honest."],
              ["Kasun P.", "Colombo, Sri Lanka", "Started with $100 on a Standard account. The welcome bonus gave me room to learn, and the charts are the cleanest I've used."],
              ["Marcus T.", "London, UK", "Spreads from 0.0 pips are real. I run EAs on the Zero account and execution never skips a beat, even during NFP."],
            ].map(([name, loc, quote], i) => (
              <Card key={name} className={`animate-fade-up border-border/60 bg-card/50 delay-${i + 1}`}>
                <CardContent className="p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">&ldquo;{quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300/25 to-amber-600/15 text-xs font-bold text-primary ring-1 ring-primary/25">
                      {name.split(" ").map((p) => p[0]).join("")}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{name}</div>
                      <div className="text-xs text-muted-foreground">{loc}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" className="border-y border-border/60 bg-card/30 py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Getting started</Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Start trading in 3 minutes</h2>
              <p className="mt-3 text-muted-foreground">Three quick steps between you and the markets.</p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                ["01", "Create your account", "Register with your email in under a minute — no paperwork needed to start."],
                ["02", "Fund instantly", "Deposit from $10 with cards, crypto or e-wallets. Grab your 50% welcome bonus."],
                ["03", "Trade & withdraw", "Open your first position on 120+ instruments and withdraw profits instantly."],
              ].map(([n, t, d], i) => (
                <div key={t} className="relative">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/25 to-amber-600/10 font-mono text-lg font-bold text-primary ring-1 ring-primary/30">
                      {n}
                    </span>
                    {i < 2 && <div className="hidden h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent md:block" />}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card px-6 py-16 text-center sm:px-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Your markets are open. <span className="text-gold-shimmer">Right now.</span></h2>
            <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
              Join 700,000+ traders on Finovation. Register free, claim your welcome bonus and place your first trade in minutes.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base font-bold shadow-xl shadow-primary/25" onClick={onRegister}>
                Create free account <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 border-border/70 bg-card/40 px-8 text-base backdrop-blur" onClick={onLogin}>
                I already have an account
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer (sticky bottom) ---------- */}
      <footer className="mt-auto border-t border-border/60 bg-card/40 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Finovation — a modern multi-asset trading platform built for speed, transparency and trust.
              </p>
            </div>
            {[
              ["Markets", ["Forex", "Cryptocurrencies", "Metals", "Indices", "Energy"]],
              ["Company", ["About us", "Careers", "Contact", "Legal documents", "Help center"]],
            ].map(([t, links]) => (
              <div key={t as string}>
                <h4 className="text-sm font-bold">{t as string}</h4>
                <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  {(links as string[]).map((l) => (
                    <li key={l}>
                      <a href="#markets" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
                        {l} <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h4 className="text-sm font-bold">Trading hours</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Forex: Mon–Fri, 24/5</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Crypto: 24/7</li>
                <li className="flex items-center gap-2"><Headset className="h-4 w-4 text-primary" /> Support: always on</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border/50 pt-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Risk warning: Trading leveraged products carries a high level of risk and may not be suitable for all investors.
              Past performance is not indicative of future results. Finovation is a demo platform built for showcase purposes.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">© 2026 Finovation Markets Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---------------- Markets section with category tabs ----------------
function MarketsSection({
  quotes,
  spark,
  onRegister,
}: {
  quotes: Record<string, { bid: number; ask: number; prevBid: number }>;
  spark: Record<string, number[]>;
  onRegister: () => void;
}) {
  const [cat, setCat] = useState<string>("All");
  const cats = ["All", "Forex", "Crypto", "Metals", "Indices", "Energy"];
  const list = useMemo(() => (cat === "All" ? INSTRUMENTS.slice(0, 12) : INSTRUMENTS.filter((i) => i.category === cat)), [cat]);

  return (
    <section id="markets" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Markets</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Markets that never sleep</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Live pricing on 120+ instruments. Trade the world&apos;s most popular assets from a single account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Market categories">
          {cats.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                cat === c
                  ? "bg-gradient-to-r from-amber-300 to-amber-500 text-[#20160a] shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((def) => {
          const q = quotes[def.symbol];
          const pct = changePct(def.symbol, Date.now());
          return (
            <Card
              key={def.symbol}
              className="group cursor-pointer border-border/60 bg-card/50 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
              onClick={onRegister}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold">{def.symbol}</div>
                    <div className="text-xs text-muted-foreground">{def.name}</div>
                  </div>
                  <ChangeBadge pct={pct} />
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <PriceFlash
                    value={q?.bid ?? def.basePrice}
                    prev={q?.prevBid ?? def.basePrice}
                    digits={def.digits}
                    className="font-mono text-2xl font-bold"
                  />
                  <Sparkline data={spark[def.symbol] ?? []} width={80} height={30} positive={pct >= 0} className="opacity-80 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <span>Spread</span>
                  <span className="font-mono tabular-nums text-foreground/80">{fmtPrice(def.spread, def.digits)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function AccountCard({
  name,
  tag,
  popular,
  features,
  onRegister,
}: {
  name: string;
  tag: string;
  popular: boolean;
  features: string[];
  onRegister: () => void;
}) {
  return (
    <Card
      className={`relative transition-all duration-300 hover:-translate-y-1 ${
        popular
          ? "border-primary/50 bg-gradient-to-b from-primary/12 to-card shadow-xl shadow-primary/10"
          : "border-border/60 bg-card/50 hover:border-border"
      }`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-300 to-amber-500 font-bold text-[#20160a] shadow-lg shadow-primary/25">
          MOST POPULAR
        </Badge>
      )}
      <CardContent className="p-7">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">{name}</h3>
          <span className="text-xs font-semibold text-primary">{tag}</span>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Ideal for {name === "Standard" ? "new traders" : name === "Pro" ? "experienced traders" : "high-frequency strategies"}
        </div>
        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm">
              <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-primary" /> {f}
            </li>
          ))}
        </ul>
        <Button
          className={`mt-7 w-full font-bold ${popular ? "shadow-lg shadow-primary/25" : ""}`}
          variant={popular ? "default" : "outline"}
          onClick={onRegister}
        >
          Open {name} account
        </Button>
      </CardContent>
    </Card>
  );
}
