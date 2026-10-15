"use client";

// ============================================================
// Finovation Dashboard Shell - topbar + sidebar + mobile nav
// Design: Midnight & Gold. Green/red reserved for trading
// semantics; gold for brand / active states.
// ============================================================
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useMarket } from "./market-context";
import AnimatedBackground from "./animated-bg";
import { Logo, PnlText } from "./ui-bits";
import type { AccountSummary, AppNotification, User, Trade } from "@/lib/types";
import {
  LayoutDashboard, CandlestickChart, ArrowDownToLine, ArrowUpFromLine,
  History, UserRound, Bell, Menu, LogOut, Settings, ChevronDown,
  Wallet, CheckCheck, Radio,
} from "lucide-react";

export type Section = "overview" | "trade" | "deposit" | "withdraw" | "history" | "profile";

const NAV: { id: Section; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "My Account", short: "Home", icon: LayoutDashboard },
  { id: "trade", label: "Trade", short: "Trade", icon: CandlestickChart },
  { id: "deposit", label: "Deposit", short: "Deposit", icon: ArrowDownToLine },
  { id: "withdraw", label: "Withdraw", short: "Withdraw", icon: ArrowUpFromLine },
  { id: "history", label: "History", short: "History", icon: History },
  { id: "profile", label: "Profile & Security", short: "Profile", icon: UserRound },
];

interface Props {
  user: User;
  accounts: AccountSummary[];
  notifications: AppNotification[];
  openTrades: Trade[];
  activeAccount: AccountSummary | undefined;
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  section: Section;
  onSection: (s: Section) => void;
  onLogout: () => void;
  onMarkNotificationsRead: () => void;
  children: React.ReactNode;
}

export default function Dashboard({
  user, accounts, notifications, openTrades, activeAccount, activeAccountId,
  onSelectAccount, section, onSection, onLogout, onMarkNotificationsRead, children,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { connected } = useMarket();

  const liveEquity = activeAccount?.equity ?? 0;
  const unread = notifications.filter((n) => !n.read).length;

  const navClick = (s: Section) => {
    onSection(s);
    setMobileNavOpen(false);
  };

  const SidebarNav = (
    <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
      {NAV.map((item) => {
        const I = item.icon;
        const active = section === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navClick(item.id)}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500" />
            )}
            <I className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${active ? "text-primary" : ""}`} />
            {item.label}
            {item.id === "trade" && activeAccount && activeAccount.openPositions > 0 && (
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary">
                {activeAccount.openPositions}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const BalanceCard = activeAccount && (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">Account balance</div>
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
          #{activeAccount.number.slice(-4)}
        </span>
      </div>
      <div className="mt-1.5 font-mono text-[22px] font-bold tracking-tight tabular-nums">
        ${activeAccount.balance.toFixed(2)}
      </div>
      <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{activeAccount.type} · 1:{activeAccount.leverage}</span>
        {activeAccount.floatingPnl !== 0 && <PnlText value={activeAccount.floatingPnl} className="text-[11px]" />}
      </div>
      <Button size="sm" className="mt-3.5 w-full font-bold shadow-lg shadow-primary/20" onClick={() => onSection("deposit")}>
        <ArrowDownToLine className="mr-1.5 h-4 w-4" /> Deposit
      </Button>
    </div>
  );

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background text-foreground">
      {/* ambient animated backdrop (particles + drifting glow) */}
      <AnimatedBackground variant="ambient" className="-z-10 opacity-60" />
      {/* ---------- Topbar ---------- */}
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* mobile nav trigger */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-border/60 bg-background p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center border-b border-border/60 px-4">
                  <Logo />
                </div>
                <div className="py-3">{SidebarNav}</div>
                <div className="mt-auto space-y-3 p-4">
                  {BalanceCard}
                  <Button variant="outline" className="w-full" onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block"><Logo compact /></div>

          {/* Account selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-border/70 bg-card/60 font-mono text-sm hover:bg-card">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">{activeAccount ? `#${activeAccount.number}` : "No account"}</span>
                <span className="sm:hidden">{activeAccount ? `#${activeAccount.number.slice(-3)}` : "—"}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 border-border/70">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Trading accounts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accounts.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  onClick={() => onSelectAccount(a.id)}
                  className={`flex items-center justify-between gap-3 rounded-lg ${a.id === activeAccountId ? "bg-primary/10" : ""}`}
                >
                  <div>
                    <div className="font-mono text-sm font-semibold">#{a.number}</div>
                    <div className="text-xs text-muted-foreground">{a.type} · 1:{a.leverage} · {a.openPositions} open</div>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums">${a.balance.toFixed(2)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* live equity chip */}
            <div className="hidden items-center gap-2.5 rounded-xl border border-border/60 bg-card/70 px-3.5 py-2 sm:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse bg-emerald-400" : "bg-amber-400"}`} />
              <div className="text-[11px] leading-none text-muted-foreground">Equity</div>
              <div className="font-mono text-sm font-bold leading-none tabular-nums">
                ${liveEquity.toFixed(2)}
              </div>
              {activeAccount && activeAccount.floatingPnl !== 0 && (
                <PnlText value={activeAccount.floatingPnl} className="text-[11px]" />
              )}
            </div>

            {/* connection status */}
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <Radio className={`h-3.5 w-3.5 ${connected ? "text-emerald-400" : "text-amber-400"}`} />
              {connected ? "Live" : "Reconnecting"}
            </span>

            {/* notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}>
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 px-1 text-[10px] font-bold text-[#20160a]">
                      {unread}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 border-border/70 p-0">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <span className="text-sm font-bold">Notifications</span>
                  {unread > 0 && (
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" onClick={onMarkNotificationsRead}>
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`border-b border-border/40 px-4 py-3 last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold">{n.title}</span>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* avatar menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none ring-primary/50 transition-shadow focus-visible:ring-2" aria-label="Account menu">
                  <Avatar className="h-9 w-9 border border-primary/30">
                    <AvatarFallback className="bg-gradient-to-br from-amber-300/25 to-amber-600/15 text-sm font-bold text-primary">
                      {user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 border-border/70">
                <DropdownMenuLabel>
                  <div className="font-semibold">{user.fullName}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSection("profile")}>
                  <Settings className="mr-2 h-4 w-4" /> Profile &amp; security
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-400 focus:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ---------- Desktop sidebar ---------- */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/60 lg:flex">
          <div className="py-4">{SidebarNav}</div>
          <Separator className="mx-6 bg-border/50" />
          <div className="mt-auto p-4">{BalanceCard}</div>
        </aside>

        {/* ---------- Content ---------- */}
        <main className="min-w-0 flex-1 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/60 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile navigation">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => n.id !== "withdraw").map((item) => {
            const I = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSection(item.id)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[3.5rem] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute top-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
                )}
                <I className="h-5 w-5" />
                {item.short}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
