"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

interface Props {
  token: string;
}

export function AcceptInviteButton({ token }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invite");
      }

      toast.success(data.message || "Successfully joined workspace!");
      router.push(`/workspace/${data.workspaceId}`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <Button 
      className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700" 
      onClick={handleAccept}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          Accept Invitation
          <ArrowRight className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}
