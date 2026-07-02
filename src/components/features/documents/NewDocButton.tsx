"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewDocButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, title: "Untitled Document" }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        router.push(`/workspace/${workspaceId}/documents/${data.data.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
      size="sm"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      New Document
    </Button>
  );
}
