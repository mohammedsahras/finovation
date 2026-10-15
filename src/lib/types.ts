// Shared API types for the Finovation client
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  country?: string | null;
  verified: boolean;
  kycLevel?: number;
  createdAt: string;
}

export interface AccountSummary {
  id: string;
  number: string;
  type: string;
  currency: string;
  leverage: number;
  balance: number;
  bonus: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  floatingPnl: number;
  openPositions: number;
  createdAt: string;
}

export interface Trade {
  id: string;
  ticket: string;
  symbol: string;
  side: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  closePrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  pnl?: number | null;
  commission: number;
  swap: number;
  status: "OPEN" | "CLOSED";
  comment?: string | null;
  accountId: string;
  openedAt: string;
  closedAt?: string | null;
}

export interface Transaction {
  id: string;
  reference: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  method: string;
  amount: number;
  fee: number;
  status: "COMPLETED" | "PENDING" | "REJECTED";
  note?: string | null;
  account?: { number: string; type: string } | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "INFO" | "SUCCESS" | "WARNING";
  read: boolean;
  createdAt: string;
}

export interface MeResponse {
  user: User;
  accounts: AccountSummary[];
  notifications: AppNotification[];
}
