"use client";

// ============================================================
// Finovation Landing Page (Exness-inspired)
// Hero + live market widget, live markets grid, features,
// account types, steps, CTA, sticky footer.
// ============================================================
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "./market-context";
import { Logo, PriceFlash, ChangeBadge } from "./ui-bits";
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
} from "lucide-react";

const HERO_SYMBOLS = ["EURUSD", "XAUUSD", "BTCUSD", "GBPUSD", "ETHUSD", "US30"];

export default function Landing({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const { quotes, connected } = useMarket();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ---------- Topbar ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#markets" className="transition-colors hover:text-foreground">Markets</a>
            <a href="#features" className="transition-colors hover:text-foreground">Why Finovation</a>
            <a href="#accounts" className="transition-colors hover:text-foreground">Account types</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={onLogin}>Sign in</Button>
            <Button onClick={onRegister} className="font-semibold">Open Account</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 100%)",
            }}
          />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-105 w-200 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="space-y-7">
              <Badge variant="outline" className="gap-2 border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-emerald-300">
                <Activity className="h-3.5 w-3.5" />
                {connected ? "Live market prices streaming now" : "Connecting to market feed..."}
              </Badge>
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Trade global markets
                <br />
                with{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                  precision
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Forex, crypto, metals, indices and energy — all in one platform. Instant deposits,
                lightning-fast withdrawals and spreads from 0.0 pips on Finovation.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={onRegister} className="h-12 px-7 text-base font-semibold">
                  Start trading <ArrowRight className="ml-1 h-4.5 w-4.5" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLogin} className="h-12 px-7 text-base">
                  Sign in to your account
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Licensed &amp; secure</span>
                <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-emerald-400" /> Instant withdrawals</span>
                <span className="inline-flex items-center gap-1.5"><Percent className="h-4 w-4 text-emerald-400" /> Zero deposit fees</span>
              </div>
            </div>

            {/* Live market widget */}
            <div className="relative">
              <Card className="relative z-10 border-border/70 bg-card/90 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <LineChart className="h-4 w-4 text-emerald-400" /> Market watch
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
                        <div key={sym} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/40">
                          <div>
                            <div className="text-sm font-semibold">{sym}</div>
                            <div className="text-xs text-muted-foreground">{def?.name}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <PriceFlash
                              value={q?.bid ?? 0}
                              prev={q?.prevBid ?? 0}
                              digits={def?.digits ?? 2}
                              className="text-sm font-semibold text-foreground"
                            />
                            <ChangeBadge pct={pct} className="w-[5.4rem] justify-center" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-3.5">
                    <Button className="w-full font-semibold" onClick={onRegister}>
                      Open live account — free
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* floating profit card */}
              <div className="absolute -right-3 -top-6 z-20 hidden animate-[float_5s_ease-in-out_infinite] rounded-xl border border-emerald-500/30 bg-card/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
                <div className="text-xs text-muted-foreground">BTCUSD profit</div>
                <div className="font-mono text-lg font-bold text-emerald-400">+$2,845.10</div>
              </div>
              <div className="absolute -bottom-6 -left-3 z-20 hidden animate-[float_6s_ease-in-out_infinite_reverse] rounded-xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <BadgeCheck className="h-4 w-4 text-emerald-400" /> Withdrawal approved
                </div>
                <div className="mt-0.5 font-mono text-sm text-foreground">+$1,200.00 · 2s ago</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Stats strip ---------- */}
        <section className="border-y border-border/60 bg-card/40">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
            {[
              ["700K+", "Active traders worldwide"],
              ["$4.5T", "Monthly trading volume"],
              ["120+", "Instruments across 5 classes"],
              ["24/7", "Human customer support"],
            ].map(([v, l]) => (
              <div key={l} className="text-center lg:text-left">
                <div className="text-3xl font-extrabold tracking-tight text-emerald-400">{v}</div>
                <div className="mt-1 text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Markets ---------- */}
        <MarketsSection quotes={quotes} onRegister={onRegister} />

        {/* ---------- Features ---------- */}
        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Why traders choose Finovation</h2>
            <p className="mt-3 text-muted-foreground">
              Institutional-grade infrastructure and trader-first policies — built for both beginners and pros.
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
            ].map(([Icon, title, desc]) => {
              const I = Icon as typeof Zap;
              return (
                <Card key={title as string} className="group border-border/60 bg-card/50 transition-all hover:border-emerald-500/40 hover:bg-card">
                  <CardContent className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-transform group-hover:scale-110">
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
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Pick the account that fits you</h2>
              <p className="mt-3 text-muted-foreground">Create additional accounts anytime from your Personal Area.</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {/* Standard */}
              <AccountCard
                name="Standard"
                tag="Great for beginners"
                popular={false}
                features={["Spread from 0.3 pips", "Leverage up to 1:2000", "Zero commission", "Minimum deposit $10"]}
                onRegister={onRegister}
              />
              {/* Pro */}
              <AccountCard
                name="Pro"
                tag="Most popular"
                popular={true}
                features={["Spread from 0.1 pips", "Leverage up to 1:1000", "Zero commission", "One-click trading"]}
                onRegister={onRegister}
              />
              {/* Zero */}
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

        {/* ---------- How it works ---------- */}
        <section id="how" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
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
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 font-mono text-lg font-bold text-emerald-400">
                    {n}
                  </span>
                  {i < 2 && <div className="hidden h-px flex-1 bg-gradient-to-r from-emerald-500/40 to-transparent md:block" />}
                </div>
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-card to-card px-6 py-14 text-center sm:px-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
            <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Your markets are open. Right now.</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
              Join 700,000+ traders on Finovation. Register free, claim your welcome bonus and place your first trade in minutes.
            </p>
            <Button size="lg" className="relative mt-8 h-12 px-8 text-base font-semibold" onClick={onRegister}>
              Create free account <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
            </Button>
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
                      <a href="#markets" className="inline-flex items-center gap-1 transition-colors hover:text-emerald-400">
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
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-400" /> Forex: Mon–Fri, 24/5</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-400" /> Crypto: 24/7</li>
                <li className="flex items-center gap-2"><Headset className="h-4 w-4 text-emerald-400" /> Support: always on</li>
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
function MarketsSection({ quotes, onRegister }: { quotes: Record<string, { bid: number; ask: number; prevBid: number }>; onRegister: () => void }) {
  const [cat, setCat] = useState<string>("All");
  const cats = ["All", "Forex", "Crypto", "Metals", "Indices", "Energy"];
  const list = useMemo(() => (cat === "All" ? INSTRUMENTS : INSTRUMENTS.filter((i) => i.category === cat)), [cat]);

  return (
    <section id="markets" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Markets that never sleep</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Live pricing on 120+ instruments. Trade the world&apos;s most popular assets from a single account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                cat === c ? "bg-emerald-500 text-slate-950" : "bg-muted text-muted-foreground hover:text-foreground"
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
              className="group cursor-pointer border-border/60 bg-card/50 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
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
                <div className="mt-5 flex items-end justify-between">
                  <PriceFlash
                    value={q?.bid ?? def.basePrice}
                    prev={q?.prevBid ?? def.basePrice}
                    digits={def.digits}
                    className="font-mono text-2xl font-bold text-foreground"
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    <div>spread</div>
                    <div className="font-mono text-foreground/80">{fmtPrice(def.spread, def.digits)}</div>
                  </div>
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
      className={`relative border ${
        popular ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-card shadow-xl shadow-emerald-500/5" : "border-border/60 bg-card/50"
      }`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 font-semibold text-slate-950">MOST POPULAR</Badge>
      )}
      <CardContent className="p-7">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">{name}</h3>
          <span className="text-xs font-medium text-emerald-400">{tag}</span>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">Ideal for {name === "Standard" ? "new traders" : name === "Pro" ? "experienced traders" : "high-frequency strategies"}</div>
        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm">
              <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-emerald-400" /> {f}
            </li>
          ))}
        </ul>
        <Button
          className={`mt-7 w-full font-semibold ${popular ? "" : "variant-outline"}`}
          variant={popular ? "default" : "outline"}
          onClick={onRegister}
        >
          Open {name} account
        </Button>
      </CardContent>
    </Card>
  );
}
