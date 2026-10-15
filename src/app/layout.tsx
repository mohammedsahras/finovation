import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finovation — Trade Global Markets",
  description: "Finovation is a modern online trading platform: forex, crypto, metals, indices and energy with instant deposits, fast withdrawals and live prices.",
  keywords: ["Finovation", "trading", "forex", "crypto", "deposit", "withdraw", "trading platform"],
  authors: [{ name: "Finovation" }],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%2310b981'/%3E%3Cpath d='M5 16.5l4.5-5.5 3.5 2.7L19 6.5' stroke='%230f172a' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "Finovation — Trade Global Markets",
    description: "Trade forex, crypto, metals and indices with live prices and instant payments.",
    siteName: "Finovation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
