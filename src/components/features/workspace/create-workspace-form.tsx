"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Sparkles } from "lucide-react";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Workspace name is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create workspace");
        return;
      }

      setName("");
      setDescription("");
      router.refresh();
      if (data.data?.id) {
        router.push(`/workspace/${data.data.id}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl border border-border/50 p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            Quick start
          </p>
          <h2 className="text-lg font-semibold">Create a workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a new collaboration space and invite your team later.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace name</Label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Launch planning"
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-description">Description</Label>
          <Input
            id="workspace-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional"
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="glow gap-2 px-5" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create
            </>
          )}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}