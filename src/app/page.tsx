"use client";

// ============================================================
// Finovation - single-page app entry.
// view: landing -> auth -> dashboard (overview / trade /
// deposit / withdraw / history / profile)
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { MarketProvider } from "@/components/finovation/market-context";
import Landing from "@/components/finovation/landing";
import AuthView from "@/components/finovation/auth-view";
import Dashboard, { type Section } from "@/components/finovation/dashboard";
import Overview from "@/components/finovation/overview";
import TradeTerminal from "@/components/finovation/trade";
import Deposit from "@/components/finovation/deposit";
import Withdraw from "@/components/finovation/withdraw";
import HistoryView from "@/components/finovation/history";
import Profile from "@/components/finovation/profile";
import { Logo } from "@/components/finovation/ui-bits";
import { api } from "@/lib/client-api";
import type { AccountSummary, AppNotification, MeResponse, Trade, User } from "@/lib/types";

type View = "landing" | "auth" | "app";

export default function Home() {
  return (
    <MarketProvider>
      <App />
    </MarketProvider>
  );
}

function App() {
  const [view, setView] = useState<View>("landing");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [section, setSection] = useState<Section>("overview");
  const [activeAccountId, setActiveAccountId] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  // ---------- session bootstrap ----------
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = localStorage.getItem("fin_token");
      if (token) {
        try {
          const me = await api<MeResponse>("/api/auth/me");
          if (!cancelled) {
            setUser(me.user);
            setAccounts(me.accounts);
            setNotifications(me.notifications);
            if (me.accounts.length > 0) setActiveAccountId(me.accounts[0].id);
            setView("app");
          }
        } catch {
          localStorage.removeItem("fin_token");
        }
      }
      if (!cancelled) setBooting(false);
    };
    const t = setTimeout(bootstrap, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // ---------- data loaders ----------
  const refreshMe = useCallback(async () => {
    try {
      const me = await api<MeResponse>("/api/auth/me");
      setUser(me.user);
      setAccounts(me.accounts);
      setNotifications(me.notifications);
      setActiveAccountId((prev) =>
        prev && me.accounts.some((a) => a.id === prev) ? prev : me.accounts[0]?.id ?? ""
      );
    } catch {
      /* session may have expired; polling continues */
    }
  }, []);

  const refreshTrades = useCallback(async () => {
    try {
      const r = await api<{ trades: Trade[] }>("/api/trades?status=OPEN");
      setOpenTrades(r.trades);
    } catch {
      /* ignore */
    }
  }, []);

  // ---------- polling loop (balance, SL/TP, notifications) ----------
  useEffect(() => {
    if (view !== "app") return;
    const tick = () => {
      refreshMe();
      refreshTrades();
    };
    const initial = setTimeout(tick, 0);
    pollRef.current = setInterval(tick, 5000);
    return () => {
      clearTimeout(initial);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [view, refreshMe, refreshTrades]);

  // ---------- auth handlers ----------
  const handleAuthed = useCallback(
    async (token: string) => {
      localStorage.setItem("fin_token", token);
      await refreshMe();
      setSection("overview");
      setView("app");
    },
    [refreshMe]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("fin_token");
    setUser(null);
    setAccounts([]);
    setNotifications([]);
    setOpenTrades([]);
    setSection("overview");
    setView("landing");
  }, []);

  const markNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api("/api/notifications", { method: "POST" });
    } catch {
      /* ignore */
    }
  }, []);

  // ---------- boot splash ----------
  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
          </div>
        </div>
      </div>
    );
  }

  if (view === "landing") {
    return (
      <div className="dark">
        <Landing
          onLogin={() => {
            setAuthMode("login");
            setView("auth");
          }}
          onRegister={() => {
            setAuthMode("register");
            setView("auth");
          }}
        />
      </div>
    );
  }

  if (view === "auth" || !user) {
    return (
      <div className="dark">
        <AuthView
          onBack={() => setView("landing")}
          onAuthed={handleAuthed}
          initialMode={authMode}
        />
      </div>
    );
  }

  return (
    <div className="dark">
      <Dashboard
        user={user}
        accounts={accounts}
        notifications={notifications}
        openTrades={openTrades}
        activeAccount={activeAccount}
        activeAccountId={activeAccount?.id ?? ""}
        onSelectAccount={setActiveAccountId}
        section={section}
        onSection={setSection}
        onLogout={handleLogout}
        onMarkNotificationsRead={markNotificationsRead}
      >
        {section === "overview" && (
          <Overview
            user={user}
            accounts={accounts}
            activeAccount={activeAccount}
            openTrades={openTrades}
            onSection={(s) => setSection(s)}
            refreshMe={refreshMe}
          />
        )}
        {section === "trade" && (
          <TradeTerminal activeAccount={activeAccount} openTrades={openTrades} refreshMe={refreshMe} />
        )}
        {section === "deposit" && (
          <Deposit
            accounts={accounts}
            activeAccount={activeAccount}
            onSelectAccount={setActiveAccountId}
            refreshMe={refreshMe}
          />
        )}
        {section === "withdraw" && (
          <Withdraw
            accounts={accounts}
            activeAccount={activeAccount}
            onSelectAccount={setActiveAccountId}
            refreshMe={refreshMe}
          />
        )}
        {section === "history" && <HistoryView accounts={accounts} activeAccount={activeAccount} />}
        {section === "profile" && <Profile user={user} refreshMe={refreshMe} />}
      </Dashboard>
    </div>
  );
}
