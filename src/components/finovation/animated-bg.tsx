"use client";

import { useEffect, useRef } from "react";

/**
 * AnimatedBackground — canvas backdrop for the landing hero and app shell.
 *
 * variant="hero"    : 3 parallax candlestick layers + gradient trend line +
 *                     twinkling particles. Chart layers are seeded from the
 *                     live market feed (SQLite-backed price engine) when a
 *                     seedPrice is provided, then drift with a random walk.
 * variant="ambient" : soft particles + slow glow, no chart lines — for the
 *                     dashboard shell and auth panel where readability matters.
 *
 * Performance: single rAF loop, DPR capped at 1.75, pauses when the tab is
 * hidden, and renders a single static frame when the user prefers reduced
 * motion.
 */

interface Candle {
  o: number;
  c: number;
  hi: number;
  lo: number;
}

interface Layer {
  candles: Candle[];
  speed: number; // px per second
  spacing: number;
  base: number;
  amp: number; // price step magnitude
  color: string; // wick/body stroke
  up: string;
  down: string;
  lineAlpha: number;
  _acc?: number; // accumulated scroll distance (internal)
}

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  hue: "gold" | "white";
  freq: number;
  phase: number;
}

const GOLD = "240, 177, 63";
const SLATE = "148, 163, 184";
const EMERALD = "52, 211, 153";
const RED = "248, 113, 113";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeLayer(
  base: number,
  amp: number,
  spacing: number,
  speed: number,
  count: number,
  color: string,
  alpha: number,
  lineAlpha: number,
): Layer {
  const candles: Candle[] = [];
  let price = base;
  for (let i = 0; i < count; i++) {
    const o = price;
    const c = o + rand(-amp, amp);
    const hi = Math.max(o, c) + rand(0, amp * 0.6);
    const lo = Math.min(o, c) - rand(0, amp * 0.6);
    candles.push({ o, c, hi, lo });
    price = c;
  }
  return {
    candles,
    speed,
    spacing,
    base,
    amp,
    color: `rgba(${color}, ${alpha})`,
    up: `rgba(${EMERALD}, ${alpha * 0.9})`,
    down: `rgba(${RED}, ${alpha * 0.9})`,
    lineAlpha,
  };
}

export default function AnimatedBackground({
  variant = "hero",
  seedPrice,
  className = "",
}: {
  variant?: "hero" | "ambient";
  seedPrice?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seedRef = useRef<number | undefined>(seedPrice);

  // keep latest seed without restarting the animation loop
  useEffect(() => {
    seedRef.current = seedPrice;
  }, [seedPrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hero = variant === "hero";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let disposed = false;

    let layers: Layer[] = [];
    let particles: Particle[] = [];

    const makeParticles = (n: number) => {
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: rand(0.6, hero ? 2.1 : 1.4),
        vy: rand(4, hero ? 16 : 9),
        vx: rand(-3, 3),
        hue: Math.random() > 0.45 ? "gold" : "white",
        freq: rand(0.4, 1.4),
        phase: rand(0, Math.PI * 2),
      }));
    };

    const buildScene = () => {
      const seed = seedRef.current ?? 1.08;
      if (hero) {
        layers = [
          makeLayer(seed, seed * 0.0006, 30, 7, Math.ceil(width / 30) + 4, SLATE, 0.1, 0),
          makeLayer(seed * 2, seed * 0.0009, 26, 13, Math.ceil(width / 26) + 4, GOLD, 0.16, 0.28),
          makeLayer(seed * 3, seed * 0.0012, 22, 22, Math.ceil(width / 22) + 4, SLATE, 0.22, 0),
        ];
        makeParticles(Math.min(52, Math.round(width / 26)));
      } else {
        layers = [];
        makeParticles(Math.min(26, Math.round(width / 50)));
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(320, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
      if (reduced) drawFrame(0, 0); // static frame for reduced motion
    };

    const drawCandles = (layer: Layer, t: number) => {
      const arr = layer.candles;
      const n = arr.length;
      // vertical placement: center the series, walk stays inside a band
      const bandH = height * 0.72;
      const midY = height * 0.52;
      const scale = bandH / (layer.amp * 14);

      const bodyW = layer.spacing * 0.42;
      ctx.lineWidth = 1;

      for (let i = 0; i < n; i++) {
        const cd = arr[i];
        const x = i * layer.spacing - ((t * layer.speed) % layer.spacing);
        const yo = midY - (cd.o - layer.base) * scale;
        const yc = midY - (cd.c - layer.base) * scale;
        const yh = midY - (cd.hi - layer.base) * scale;
        const yl = midY - (cd.lo - layer.base) * scale;
        if (x < -bodyW - 4 || x > width + bodyW + 4) continue;

        // wick
        ctx.strokeStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(x, yh);
        ctx.lineTo(x, yl);
        ctx.stroke();

        // body
        const top = Math.min(yo, yc);
        const h = Math.max(1.2, Math.abs(yc - yo));
        ctx.fillStyle = cd.c >= cd.o ? layer.up : layer.down;
        ctx.beginPath();
        // rounded rect body (radius clamped by half-height)
        const r = Math.min(2, h / 2);
        ctx.roundRect(x - bodyW / 2, top, bodyW, h, r);
        ctx.fill();
      }

      // gradient trend line through close prices (nearest gold layer only)
      if (layer.lineAlpha > 0) {
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, `rgba(${GOLD}, 0)`);
        grad.addColorStop(0.25, `rgba(${GOLD}, ${layer.lineAlpha})`);
        grad.addColorStop(0.75, `rgba(${GOLD}, ${layer.lineAlpha})`);
        grad.addColorStop(1, `rgba(${GOLD}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const offset = (t * layer.speed) % layer.spacing;
        for (let i = 0; i < n; i++) {
          const x = i * layer.spacing - offset;
          const y = midY - (arr[i].c - layer.base) * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const stepCandles = (dt: number) => {
      for (const layer of layers) {
        // advance the walk by candles scrolled off the left edge
        const shift = layer.speed * dt;
        layer._acc = (layer._acc ?? 0) + shift;
        while (layer._acc >= layer.spacing) {
          layer._acc -= layer.spacing;
          const last = layer.candles[layer.candles.length - 1];
          const o = last.c;
          const c = o + rand(-layer.amp, layer.amp);
          const hi = Math.max(o, c) + rand(0, layer.amp * 0.6);
          const lo = Math.min(o, c) - rand(0, layer.amp * 0.6);
          layer.candles.push({ o, c, hi, lo });
          if (layer.candles.length > Math.ceil(width / layer.spacing) + 8) {
            layer.candles.shift();
          }
        }
      }
    };

    const drawParticles = (t: number) => {
      for (const p of particles) {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.freq + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle =
          p.hue === "gold"
            ? `rgba(${GOLD}, ${0.5 * tw})`
            : `rgba(226, 232, 240, ${0.35 * tw})`;
        ctx.fill();
      }
    };

    const stepParticles = (dt: number) => {
      for (const p of particles) {
        p.y -= p.vy * dt;
        p.x += p.vx * dt;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;
      }
    };

    const drawFrame = (t: number, _dt: number) => {
      ctx.clearRect(0, 0, width, height);
      if (hero) {
        for (const layer of layers) drawCandles(layer, t);
      }
      drawParticles(t);
    };

    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(tick);
      if (!running) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      stepCandles(dt);
      stepParticles(dt);
      drawFrame(elapsed, dt);
    };

    const onVisibility = () => {
      running = !document.hidden;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      drawFrame(0, 0);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [variant]);

  const isHero = variant === "hero";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* drifting aurora orbs (CSS — cheap, composited on GPU) */}
      <div
        className={`animate-orb-1 absolute -top-40 left-1/4 rounded-full bg-primary/12 blur-3xl ${
          isHero ? "h-105 w-150" : "h-80 w-105 opacity-70"
        }`}
      />
      <div
        className={`animate-orb-2 absolute -bottom-32 right-0 rounded-full bg-emerald-500/8 blur-3xl ${
          isHero ? "h-96 w-125" : "h-64 w-90 opacity-60"
        }`}
      />
      {isHero && (
        <div className="animate-orb-3 absolute left-0 top-1/3 h-72 w-72 rounded-full bg-sky-500/6 blur-3xl" />
      )}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
