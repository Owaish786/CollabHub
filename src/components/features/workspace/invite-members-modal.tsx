"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Link as LinkIcon, Check, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  workspaceId: string;
}

export function InviteMembersModal({ workspaceId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role] = useState("member");
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link");
      
      setShareLink(data.inviteLink);
      toast.success("Share link generated!");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      
      toast.success("Invitation sent successfully!");
      setEmail("");
      setOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors mt-2 mb-2">
        <span className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Members
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            Invite members to your workspace to collaborate together.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Email Invite Section */}
          <form onSubmit={handleSendEmail} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button type="submit" disabled={loading || !email}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send
                </Button>
              </div>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or share a link</span>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="space-y-3">
            {!shareLink ? (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGenerateLink}
                disabled={loading}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate shareable link
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input value={shareLink} readOnly />
                <Button variant="secondary" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4" /> : "Copy"}
                </Button>
              </div>
            )}
            <p className="text-xs text-slate-500 text-center">
              Anyone with this link will be able to join as a {role}.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
