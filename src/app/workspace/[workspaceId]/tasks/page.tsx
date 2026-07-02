"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { KanbanBoard } from "@/components/features/tasks/KanbanBoard";
import { TaskModal } from "@/components/features/tasks/TaskModal";
import { Plus, LayoutGrid, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignees: string[];
  deadline?: string;
  labels: string[];
  order: number;
  createdBy: string;
  createdAt: string;
};

type View = "kanban" | "list";

export default function TasksPage() {
  const params = useParams<{ workspaceId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("kanban");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
    }
  };

  const handleDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditingTask(null);
  };

  const handleReorder = async (newTasks: Task[]) => {
    // Optimistic UI update
    setTasks(newTasks);

    // Filter tasks that belong to the affected columns to minimize payload, 
    // or just send all to be safe. We'll send all for simplicity, or 
    // we can optimize later.
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
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
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

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          tasks={tasks}
          onReorder={handleReorder}
          onTaskClick={setEditingTask}
          onNewTask={() => { setIsCreateOpen(true); }}
        />
      ) : (
        <ListView
          tasks={tasks}
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
        <p className="text-slate-500">No tasks yet. Create your first one!</p>
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-800">{task.title}</td>
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
                  {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
