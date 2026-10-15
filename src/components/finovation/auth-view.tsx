"use client";

// ============================================================
// Finovation Auth - split screen login / register
// ============================================================
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "./ui-bits";
import { api } from "@/lib/client-api";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, Zap, Percent } from "lucide-react";

const COUNTRIES = [
  "Sri Lanka", "India", "United States", "United Kingdom", "United Arab Emirates",
  "Singapore", "Malaysia", "South Africa", "Nigeria", "Kenya", "Philippines",
  "Vietnam", "Thailand", "Indonesia", "Pakistan", "Bangladesh", "Other",
];

interface Props {
  onBack: () => void;
  onAuthed: (token: string) => void;
}

export default function AuthView({ onBack, onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:grid lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-500/15 via-card to-background p-10 lg:flex">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <Logo size="lg" />
        <div className="relative space-y-6">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            The markets are moving.
            <span className="block text-emerald-400">Be ready in minutes.</span>
          </h2>
          <div className="space-y-4">
            {[
              [Zap, "Instant deposits & withdrawals", "Cards, crypto and e-wallets — processed 24/7."],
              [Percent, "50% welcome bonus", "Boost your first deposit, up to $500 extra."],
              [ShieldCheck, "Negative balance protection", "You can never lose more than you deposit."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Zap;
              return (
                <div key={t as string} className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <I className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{t as string}</div>
                    <div className="text-sm text-muted-foreground">{d as string}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative text-sm text-muted-foreground">700,000+ traders already trust Finovation</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="w-9" />
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to access your trading accounts."
                : "Register free — it takes less than a minute."}
            </p>
          </div>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-6">
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md py-2 text-sm font-semibold transition-all ${
                      mode === m ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "login" ? "Sign in" : "Register"}
                  </button>
                ))}
              </div>

              {mode === "login" ? <LoginForm onAuthed={onAuthed} /> : <RegisterForm onAuthed={onAuthed} />}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to Finovation&apos;s Terms of Service and Privacy Policy.
            This is a demo platform — no real funds are involved.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onAuthed }: { onAuthed: (t: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/api/auth/login", { method: "POST", body: { email, password } });
      toast.success("Signed in — welcome back!");
      onAuthed(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full font-semibold" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function RegisterForm({ onAuthed }: { onAuthed: (t: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/api/auth/register", {
        method: "POST",
        body: { fullName, email, password, country: country || null, phone: phone || null },
      });
      toast.success("Account created — welcome to Finovation!");
      onAuthed(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" placeholder="John Perera" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" type="tel" placeholder="+94 77 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
      </div>
      {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full font-semibold" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Creating account..." : "Create free account"}
      </Button>
    </form>
  );
}
