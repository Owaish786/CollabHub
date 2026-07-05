"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Loader2, Calendar, Tag, Sparkles, Check, Plus, Square, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Task, Subtask } from "@/app/workspace/[workspaceId]/tasks/page";

interface Props {
  mode: "create" | "edit";
  task?: Task;
  workspaceMembers?: { id: string; name: string; email: string; image?: string }[];
  onClose: () => void;
  onSubmit: (values: Partial<Task>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const STATUSES: Task["status"][] = ["todo", "in-progress", "review", "done"];
const PRIORITIES: Task["priority"][] = ["low", "medium", "high", "urgent"];

const COVER_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
];

const priorityColor: Record<string, string> = {
  low:    "border-slate-300 bg-slate-50 text-slate-600",
  medium: "border-blue-300 bg-blue-50 text-blue-700",
  high:   "border-amber-300 bg-amber-50 text-amber-700",
  urgent: "border-red-300 bg-red-50 text-red-700",
};

export function TaskModal({ mode, task, workspaceMembers = [], onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? "todo");
  const [priority, setPriority] = useState<Task["priority"]>(task?.priority ?? "medium");
  const [deadline, setDeadline] = useState(task?.deadline ? task.deadline.slice(0, 10) : "");
  const [assignees, setAssignees] = useState<string[]>(task?.assignees?.map(a => typeof a === 'string' ? a : (a as { _id?: string, id?: string })._id || (a as { _id?: string, id?: string }).id || "") ?? []);
  const [label, setLabel] = useState("");
  const [labels, setLabels] = useState<string[]>(task?.labels ?? []);
  const [comments, setComments] = useState<{ _id?: string, text: string, createdAt: string, user?: { name: string, image?: string } }[]>(task?.comments ?? []);
  const [newComment, setNewComment] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [coverColor, setCoverColor] = useState<string | null>(task?.coverColor ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

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
      await onSubmit({
        title: title.trim(),
        description,
        status,
        priority,
        deadline: deadline || undefined,
        labels,
        assignees,
        subtasks,
        coverColor,
      });
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

  // Subtask helpers
  const addSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), text: trimmed, completed: false }]);
    setNewSubtaskText("");
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  // AI Breakdown
  const handleAiBreakdown = async () => {
    if (!title.trim()) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
      }
    } catch {
      // silently fail
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [...prev, data.data]);
        setNewComment("");
      }
    } catch {
      // ignore
    }
  };

  const acceptSuggestion = (text: string) => {
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), text, completed: false }]);
    setAiSuggestions((prev) => prev.filter((s) => s !== text));
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in rounded-2xl border border-slate-200 bg-white shadow-strong">
        {/* Cover color preview */}
        {coverColor && (
          <div className="h-2 w-full rounded-t-2xl" style={{ backgroundColor: coverColor }} />
        )}

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

          {/* Cover Color */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Card Color</Label>
            <div className="flex items-center gap-2">
              {/* No color option */}
              <button
                type="button"
                onClick={() => setCoverColor(null)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                  coverColor === null ? "border-slate-400 bg-slate-100" : "border-slate-200 hover:border-slate-300"
                )}
              >
                {coverColor === null && <X className="h-3 w-3 text-slate-500" />}
              </button>
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCoverColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                    coverColor === c ? "border-slate-700 scale-110" : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                >
                  {coverColor === c && <Check className="h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
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

          {/* Assignees */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Assignees</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {workspaceMembers.filter(m => assignees.includes(m.id)).map(member => (
                <div key={member.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 pl-1 pr-2 py-1 text-[11px] font-medium text-slate-700">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="h-4 w-4 rounded-full" />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-bold text-indigo-700">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {member.name}
                  <button type="button" onClick={() => setAssignees(prev => prev.filter(a => a !== member.id))} className="text-slate-400 hover:text-slate-700">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val && !assignees.includes(val)) {
                  setAssignees(prev => [...prev, val]);
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Add assignee...</option>
              {workspaceMembers.filter(m => !assignees.includes(m.id)).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
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

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <CheckSquare className="h-3.5 w-3.5" /> Subtasks
                {subtasks.length > 0 && (
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    ({completedCount}/{subtasks.length})
                  </span>
                )}
              </Label>

              {/* AI Breakdown button */}
              <button
                type="button"
                onClick={handleAiBreakdown}
                disabled={aiLoading || !title.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI Breakdown
              </button>
            </div>

            {/* Add subtask input */}
            <div className="flex gap-2">
              <Input
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                placeholder="Add a subtask…"
                className="border-slate-200 focus:border-indigo-400 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addSubtask} className="border-slate-200 shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Subtask list */}
            {subtasks.length > 0 && (
              <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => toggleSubtask(s.id)}
                      className="shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {s.completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm",
                      s.completed ? "text-slate-400 line-through" : "text-slate-700"
                    )}>
                      {s.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(s.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        completedCount === subtasks.length ? "bg-emerald-500" : "bg-indigo-500"
                      )}
                      style={{ width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
                <p className="text-[11px] font-medium text-indigo-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Suggestions — click to add
                </p>
                {aiSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => acceptSuggestion(suggestion)}
                    className="flex w-full items-center gap-2 rounded-md bg-white px-3 py-2 text-left text-sm text-slate-700 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
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

          {/* Comments Section (Edit Mode Only) */}
          {mode === "edit" && task && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments
              </Label>
              
              <div className="space-y-4 mb-4 max-h-48 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400">No comments yet.</p>
                ) : (
                  comments.map((comment, i) => (
                    <div key={comment._id || i} className="flex gap-2">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200 overflow-hidden">
                        {comment.user?.image ? (
                          <img src={comment.user.image} alt={comment.user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-[10px] font-bold text-indigo-700">
                            {(comment.user?.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold text-slate-700">{comment.user?.name}</span>
                          <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddComment(); } }}
                  placeholder="Write a comment..."
                  className="border-slate-200 focus:border-indigo-400 text-sm"
                />
                <Button type="button" size="sm" onClick={handleAddComment} disabled={!newComment.trim()} className="bg-slate-800 hover:bg-slate-900 text-white shrink-0">
                  Post
                </Button>
              </div>
            </div>
          )}

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
