"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Loader2, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Task } from "@/app/workspace/[workspaceId]/tasks/page";

interface Props {
  mode: "create" | "edit";
  task?: Task;
  onClose: () => void;
  onSubmit: (values: Partial<Task>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const STATUSES: Task["status"][] = ["todo", "in-progress", "review", "done"];
const PRIORITIES: Task["priority"][] = ["low", "medium", "high", "urgent"];

const priorityColor: Record<string, string> = {
  low:    "border-slate-300 bg-slate-50 text-slate-600",
  medium: "border-blue-300 bg-blue-50 text-blue-700",
  high:   "border-amber-300 bg-amber-50 text-amber-700",
  urgent: "border-red-300 bg-red-50 text-red-700",
};

export function TaskModal({ mode, task, onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? "todo");
  const [priority, setPriority] = useState<Task["priority"]>(task?.priority ?? "medium");
  const [deadline, setDeadline] = useState(task?.deadline ? task.deadline.slice(0, 10) : "");
  const [label, setLabel] = useState("");
  const [labels, setLabels] = useState<string[]>(task?.labels ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), description, status, priority, deadline: deadline || undefined, labels });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  };

  const addLabel = () => {
    const trimmed = label.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels((prev) => [...prev, trimmed]);
    }
    setLabel("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-2xl border border-slate-200 bg-white shadow-strong">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {mode === "create" ? "New Task" : "Edit Task"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-sm font-medium text-slate-700">Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="border-slate-200 focus:border-indigo-400"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-sm font-medium text-slate-700">Description</Label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-none"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("-", " ")}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Priority</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all",
                      priority === p ? priorityColor[p] : "border-slate-200 text-slate-400 hover:border-slate-300"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label htmlFor="task-deadline" className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Calendar className="h-3.5 w-3.5" /> Deadline
            </Label>
            <Input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border-slate-200 focus:border-indigo-400"
            />
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Tag className="h-3.5 w-3.5" /> Labels
            </Label>
            <div className="flex gap-2">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
                placeholder="Add label…"
                className="border-slate-200 focus:border-indigo-400"
              />
              <Button type="button" variant="outline" size="sm" onClick={addLabel} className="border-slate-200">
                Add
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {labels.map((l) => (
                  <span key={l} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {l}
                    <button type="button" onClick={() => setLabels((prev) => prev.filter((x) => x !== l))} className="hover:text-indigo-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {mode === "edit" && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="ml-1.5">Delete</span>
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="border-slate-200">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || !title.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
