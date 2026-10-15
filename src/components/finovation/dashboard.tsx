"use client";

// ============================================================
// Finovation Dashboard Shell - topbar + sidebar + mobile nav
// ============================================================
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMarket } from "./market-context";
import { Logo, PnlText } from "./ui-bits";
import type { AccountSummary, AppNotification, User, Trade } from "@/lib/types";
import {
  LayoutDashboard, CandlestickChart, ArrowDownToLine, ArrowUpFromLine,
  History, UserRound, Bell, Menu, LogOut, Settings, ChevronDown,
  Wallet, Radio,
} from "lucide-react";

export type Section = "overview" | "trade" | "deposit" | "withdraw" | "history" | "profile";

const NAV: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "My Account", icon: LayoutDashboard },
  { id: "trade", label: "Trade", icon: CandlestickChart },
  { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { id: "history", label: "History", icon: History },
  { id: "profile", label: "Profile & Security", icon: UserRound },
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
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const I = item.icon;
        const active = section === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navClick(item.id)}
            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <I className="h-[18px] w-[18px]" />
            {item.label}
            {item.id === "trade" && activeAccount && activeAccount.openPositions > 0 && (
              <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                {activeAccount.openPositions}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ---------- Topbar ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* mobile nav trigger */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center border-b border-border/60 px-4">
                  <Logo />
                </div>
                <div className="py-3">{SidebarNav}</div>
                <div className="mt-auto p-4">
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
              <Button variant="outline" className="gap-2 font-mono text-sm">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">{activeAccount ? `#${activeAccount.number}` : "No account"}</span>
                <span className="sm:hidden">{activeAccount ? `#${activeAccount.number.slice(-3)}` : "—"}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Trading accounts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accounts.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  onClick={() => onSelectAccount(a.id)}
                  className={`flex items-center justify-between gap-3 ${a.id === activeAccountId ? "bg-emerald-500/10" : ""}`}
                >
                  <div>
                    <div className="font-mono text-sm">#{a.number}</div>
                    <div className="text-xs text-muted-foreground">{a.type} · 1:{a.leverage}</div>
                  </div>
                  <span className="font-mono text-sm font-semibold">${a.balance.toFixed(2)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* live equity chip */}
            <div className="hidden items-center gap-2.5 rounded-lg border border-border/60 bg-card/70 px-3.5 py-1.5 sm:flex">
              <div className="text-[11px] leading-none text-muted-foreground">Equity</div>
              <div className="font-mono text-sm font-bold leading-none text-emerald-400">
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
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-slate-950">
                      {unread}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unread > 0 && (
                    <button className="text-xs text-emerald-400 hover:underline" onClick={onMarkNotificationsRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`border-b border-border/40 px-4 py-3 last:border-0 ${!n.read ? "bg-emerald-500/5" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold">{n.title}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
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
                <button className="rounded-full outline-none ring-emerald-500/50 focus-visible:ring-2" aria-label="Account menu">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-emerald-500/15 text-sm font-bold text-emerald-300">
                      {user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-border/60 bg-card/30 lg:flex">
          <div className="py-4">{SidebarNav}</div>
          <Separator className="mx-6 bg-border/50" />
          <div className="mt-auto p-5">
            {activeAccount && (
              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="text-xs font-medium text-muted-foreground">Account balance</div>
                <div className="mt-1 font-mono text-xl font-bold">${activeAccount.balance.toFixed(2)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {activeAccount.type} · Leverage 1:{activeAccount.leverage}
                </div>
                <Button size="sm" className="mt-3 w-full font-semibold" onClick={() => onSection("deposit")}>
                  <ArrowDownToLine className="mr-1.5 h-4 w-4" /> Deposit
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* ---------- Content ---------- */}
        <main className="min-w-0 flex-1 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => n.id !== "withdraw").map((item) => {
            const I = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSection(item.id)}
                className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? "text-emerald-400" : "text-muted-foreground"
                }`}
              >
                <I className="h-5 w-5" />
                {item.label === "My Account" ? "Home" : item.label === "Profile & Security" ? "Profile" : item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
