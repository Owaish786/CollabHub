"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { KanbanBoard } from "@/components/features/tasks/KanbanBoard";
import { TaskModal } from "@/components/features/tasks/TaskModal";
import { Plus, LayoutGrid, List, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSocket } from "@/components/providers/SocketProvider";

export type Subtask = {
  id: string;
  text: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignees: string[];
  deadline?: string;
  labels: string[];
  subtasks: Subtask[];
  coverColor: string | null;
  order: number;
  createdBy: string;
  createdAt: string;
};

type View = "kanban" | "list";

const PRIORITY_OPTIONS: Task["priority"][] = ["low", "medium", "high", "urgent"];

export default function TasksPage() {
  const params = useParams<{ workspaceId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("kanban");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { socket, isConnected } = useSocket();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | null>(null);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?workspaceId=${params.workspaceId}`);
      const data = await res.json();
      if (data.success) setTasks(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [params.workspaceId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("join-workspace", params.workspaceId);

    const handleTasksUpdated = () => {
      void fetchTasks();
    };

    socket.on("tasks-updated", handleTasksUpdated);

    return () => {
      socket.emit("leave-workspace", params.workspaceId);
      socket.off("tasks-updated", handleTasksUpdated);
    };
  }, [socket, isConnected, params.workspaceId, fetchTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (labelFilter) {
      result = result.filter((t) => t.labels.includes(labelFilter));
    }

    return result;
  }, [tasks, searchQuery, priorityFilter, labelFilter]);

  // Collect all unique labels for the filter
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.labels.forEach((l) => set.add(l)));
    return Array.from(set).sort();
  }, [tasks]);

  const hasActiveFilters = searchQuery || priorityFilter || labelFilter;

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter(null);
    setLabelFilter(null);
  };

  const handleCreateTask = async (values: Partial<Task>) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, workspaceId: params.workspaceId }),
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => [...prev, data.data as Task]);
      setIsCreateOpen(false);
      if (socket && isConnected) {
        socket.emit("tasks-updated", { workspaceId: params.workspaceId });
      }
    }
  };

  const handleUpdateTask = async (id: string, values: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data.data } : t)));
      setEditingTask(null);
      if (socket && isConnected) {
        socket.emit("tasks-updated", { workspaceId: params.workspaceId });
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditingTask(null);
    if (socket && isConnected) {
      socket.emit("tasks-updated", { workspaceId: params.workspaceId });
    }
  };

  const handleReorder = async (newTasks: Task[]) => {
    setTasks(newTasks);

    const payload = newTasks.map((t) => ({
      id: t.id,
      status: t.status,
      order: t.order,
    }));

    await fetch(`/api/tasks/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: params.workspaceId, tasks: payload }),
    });

    if (socket && isConnected) {
      socket.emit("tasks-updated", { workspaceId: params.workspaceId });
    }
  };

  const priorityColor: Record<string, string> = {
    low: "bg-slate-100 text-slate-600 border-slate-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    high: "bg-amber-100 text-amber-700 border-amber-200",
    urgent: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Tasks</h1>
            <p className="text-sm text-slate-500">
              {filteredTasks.length}{hasActiveFilters ? ` of ${tasks.length}` : ""} task{filteredTasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              <button
                onClick={() => setView("kanban")}
                className={cn("rounded-md p-1.5 transition-colors", view === "kanban" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900")}
                title="Kanban view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("rounded-md p-1.5 transition-colors", view === "list" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900")}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-8 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>

          {/* Priority filter pills */}
          <div className="flex items-center gap-1">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all",
                  priorityFilter === p
                    ? priorityColor[p]
                    : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Label filter */}
          {allLabels.length > 0 && (
            <select
              value={labelFilter ?? ""}
              onChange={(e) => setLabelFilter(e.target.value || null)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-600 focus:border-indigo-400 focus:outline-none"
            >
              <option value="">All labels</option>
              {allLabels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          tasks={filteredTasks}
          allTasks={tasks}
          onReorder={handleReorder}
          onTaskClick={setEditingTask}
          onNewTask={() => { setIsCreateOpen(true); }}
        />
      ) : (
        <ListView
          tasks={filteredTasks}
          onTaskClick={setEditingTask}
        />
      )}

      {/* Create modal */}
      {isCreateOpen && (
        <TaskModal
          mode="create"
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Edit modal */}
      {editingTask && (
        <TaskModal
          mode="edit"
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(values) => handleUpdateTask(editingTask.id, values)}
          onDelete={() => handleDeleteTask(editingTask.id)}
        />
      )}
    </div>
  );
}

function ListView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const priorityColor: Record<string, string> = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700",
  };
  const statusColor: Record<string, string> = {
    todo: "bg-slate-100 text-slate-600",
    "in-progress": "bg-blue-100 text-blue-700",
    review: "bg-amber-100 text-amber-700",
    done: "bg-emerald-100 text-emerald-700",
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <List className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-slate-500">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const completedCount = task.subtasks?.filter((s) => s.completed).length ?? 0;
              const totalCount = task.subtasks?.length ?? 0;
              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      {task.coverColor && (
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: task.coverColor }} />
                      )}
                      {task.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", statusColor[task.status])}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", priorityColor[task.priority])}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {totalCount > 0 ? `${completedCount}/${totalCount}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
