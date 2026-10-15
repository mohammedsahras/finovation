"use client";

// ============================================================
// Finovation Profile & Security - personal info, password
// change, verification status, security tips.
// ============================================================
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/client-api";
import type { User } from "@/lib/types";
import { toast } from "sonner";
import {
  UserRound, Loader2, BadgeCheck, Mail, Phone, Globe, CalendarDays,
  Lock, ShieldCheck, KeyRound, Info,
} from "lucide-react";

interface Props {
  user: User;
  refreshMe: () => Promise<void>;
}

export default function Profile({ user, refreshMe }: Props) {
  // profile form
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return toast.error("Name must be at least 2 characters");
    setSavingProfile(true);
    try {
      await api("/api/profile", {
        method: "PUT",
        body: { fullName: fullName.trim(), phone: phone.trim() || null, country: country.trim() || null },
      });
      await refreshMe();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) return toast.error("Enter your current password");
    if (newPw.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPw !== confirmPw) return toast.error("New passwords do not match");
    setSavingPw(true);
    try {
      await api("/api/profile/password", {
        method: "POST",
        body: { currentPassword: currentPw, newPassword: newPw },
      });
      toast.success("Password changed successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <UserRound className="h-6 w-6 text-primary" /> Profile &amp; security
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal details and account protection.</p>
      </div>

      {/* identity card */}
      <Card className="border-border/60 bg-card/60">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-xl font-extrabold text-[#20160a] shadow-lg shadow-primary/25 ring-1 ring-amber-300/40">
            {user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold">{user.fullName}</h2>
              {user.verified ? (
                <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">Unverified</Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> KYC level {user.kycLevel ?? 1}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* personal info */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Personal information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pf-name" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="h-3 w-3" /> Full name
                </Label>
                <Input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background/60" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-email" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> Email (read-only)
                </Label>
                <Input id="pf-email" value={user.email} disabled className="bg-background/40 font-mono text-sm opacity-80" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-phone" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> Phone
                </Label>
                <Input id="pf-phone" type="tel" placeholder="+94 77 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/60" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-country" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" /> Country
                </Label>
                <Input id="pf-country" placeholder="Sri Lanka" value={country} onChange={(e) => setCountry(e.target.value)} className="bg-background/60" />
              </div>
              <Button type="submit" disabled={savingProfile} className="w-full font-semibold">
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* password + security */}
        <div className="space-y-4">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4 text-primary" /> Change password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cur-pw" className="text-xs text-muted-foreground">Current password</Label>
                  <Input id="cur-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" className="bg-background/60" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw" className="text-xs text-muted-foreground">New password</Label>
                  <Input id="new-pw" type="password" placeholder="Min. 8 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" className="bg-background/60" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cfm-pw" className="text-xs text-muted-foreground">Confirm new password</Label>
                  <Input id="cfm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" className="bg-background/60" />
                </div>
                <Button type="submit" disabled={savingPw} className="w-full font-semibold">
                  {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-primary" /> Security status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Email verified", ok: user.verified, hint: "Verification confirms account ownership." },
                { label: "Strong password", ok: true, hint: "Your password is hashed with scrypt — never stored in plain text." },
                { label: "Negative balance protection", ok: true, hint: "You can never lose more than you deposit." },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  {item.ok ? (
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.hint}</div>
                  </div>
                </div>
              ))}
              <Separator className="bg-border/50" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Finovation never asks for your password by email or phone. Demo platform — no real funds are involved.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
