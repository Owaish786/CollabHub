"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Settings, Users, UserMinus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Member = {
  user: { id: string; name: string; email: string };
  role: "owner" | "admin" | "member";
};

type Workspace = {
  id: string;
  name: string;
  description: string;
  slug: string;
  members: Member[];
};

export default function SettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const res = await fetch(`/api/workspaces/${params.workspaceId}`);
        const data = await res.json();
        if (data.success) {
          setWorkspace(data.data);
          setName(data.data.name);
          setDescription(data.data.description || "");
        }
      } finally {
        setLoading(false);
      }
    }
    void fetchWorkspace();
  }, [params.workspaceId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${params.workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace(data.data);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const copyInviteLink = () => {
    if (!workspace) return;
    const link = `${window.location.origin}/invite/${workspace.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!workspace) return null;

  const isOwner = workspace.members.some(
    (m) => m.role === "owner" && m.user.id === session?.user?.id
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your workspace preferences and members.</p>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Settings className="h-4 w-4 text-slate-500" /> General
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ws-name">Workspace Name</Label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ws-desc">Description</Label>
                <textarea
                  id="ws-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isOwner}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              {isOwner && (
                <div className="pt-2">
                  <Button type="submit" disabled={saving || !name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Users className="h-4 w-4 text-slate-500" /> Members
            </h2>
            <Button variant="outline" size="sm" onClick={copyInviteLink} className="gap-2">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Invite Link"}
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {workspace.members.map((member) => (
              <div key={member.user.id} className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {member.user.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {member.user.name} {member.user.id === session?.user?.id && "(You)"}
                    </p>
                    <p className="text-xs text-slate-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                    {member.role}
                  </span>
                  {isOwner && member.user.id !== session?.user?.id && (
                    <button className="text-slate-400 hover:text-red-600 transition-colors">
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
