"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, User, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSuccess(false);
    
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (res.ok) {
        // Update the client-side session to reflect new name without full reload
        await update({ name });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mesh-gradient min-h-screen">
      {/* Top Bar */}
      <header className="glass fixed top-0 z-50 w-full border-b border-white/20">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/dashboard" className="rounded-full p-2 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <span className="text-lg font-bold text-slate-800">Your Profile</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-12">
        <div className="glass-card overflow-hidden rounded-2xl border-0 shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{session.user.name}</h1>
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleUpdate} className="max-w-md space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-11"
                    disabled={saving}
                  />
                </div>
                <p className="text-xs text-slate-500">This is your public display name within workspaces.</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={session.user.email || ""}
                    className="pl-9 h-11 bg-slate-50 text-slate-500"
                    disabled
                  />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Email cannot be changed directly for security.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={saving || !name.trim() || name === session.user.name}
                  className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-full shadow-md text-white transition-all"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {success ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
