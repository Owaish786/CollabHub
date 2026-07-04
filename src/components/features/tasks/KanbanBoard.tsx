"use client";

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Plus, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/app/workspace/[workspaceId]/tasks/page";

type Column = {
  id: Task["status"];
  label: string;
  color: string;
  dot: string;
};

const COLUMNS: Column[] = [
  { id: "todo",        label: "To Do",       color: "bg-slate-100",  dot: "bg-slate-400"  },
  { id: "in-progress", label: "In Progress", color: "bg-blue-50",    dot: "bg-blue-500"   },
  { id: "review",      label: "Review",      color: "bg-amber-50",   dot: "bg-amber-500"  },
  { id: "done",        label: "Done",        color: "bg-emerald-50", dot: "bg-emerald-500" },
];

const priorityColor: Record<string, string> = {
  low:    "bg-slate-100 text-slate-500",
  medium: "bg-blue-100 text-blue-600",
  high:   "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

function getDeadlineStatus(deadline?: string): "overdue" | "due-soon" | null {
  if (!deadline) return null;
  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "due-soon";
  return null;
}

interface Props {
  tasks: Task[];
  allTasks: Task[];
  onReorder: (newTasks: Task[]) => void;
  onTaskClick: (task: Task) => void;
  onNewTask: (status: Task["status"]) => void;
}

export function KanbanBoard({ tasks, allTasks, onReorder, onTaskClick, onNewTask }: Props) {
  const tasksByStatus = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const destStatus = destination.droppableId as Task["status"];

    // Work with allTasks for reordering (not filtered)
    const newTasks = Array.from(allTasks);
    const taskIndex = newTasks.findIndex(t => t.id === draggableId);
    
    if (taskIndex === -1) return;

    newTasks[taskIndex].status = destStatus;

    const destTasks = newTasks
      .filter(t => t.status === destStatus && t.id !== draggableId)
      .sort((a, b) => a.order - b.order);

    destTasks.splice(destination.index, 0, newTasks[taskIndex]);

    destTasks.forEach((t, i) => {
      const idx = newTasks.findIndex(nt => nt.id === t.id);
      if (idx !== -1) newTasks[idx].order = i;
    });

    onReorder(newTasks);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.id);
          return (
            <div key={col.id} className="flex w-72 shrink-0 flex-col">
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onNewTask(col.id)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex flex-1 flex-col gap-2 rounded-xl p-2 min-h-[120px] transition-colors",
                      snapshot.isDraggingOver ? col.color : "bg-slate-100/60"
                    )}
                  >
                    {colTasks.map((task, index) => {
                      const deadlineStatus = getDeadlineStatus(task.deadline);
                      const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;
                      const totalSubtasks = task.subtasks?.length ?? 0;
                      const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(drag, dragSnapshot) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              onClick={() => onTaskClick(task)}
                              className={cn(
                                "cursor-pointer rounded-xl border bg-white shadow-sm transition-all overflow-hidden",
                                dragSnapshot.isDragging && "shadow-lg rotate-1",
                                deadlineStatus === "overdue"
                                  ? "border-red-300 ring-1 ring-red-200"
                                  : deadlineStatus === "due-soon"
                                  ? "border-amber-300 ring-1 ring-amber-200"
                                  : "border-slate-200"
                              )}
                            >
                              {/* Cover color strip */}
                              {task.coverColor && (
                                <div
                                  className="h-1.5 w-full"
                                  style={{ backgroundColor: task.coverColor }}
                                />
                              )}

                              <div className="p-3.5">
                                <p className="text-[13px] font-medium leading-snug text-slate-800">
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-400">
                                    {task.description}
                                  </p>
                                )}

                                {/* Subtask progress bar */}
                                {totalSubtasks > 0 && (
                                  <div className="mt-2.5">
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                      <span>Subtasks</span>
                                      <span className="font-medium">{completedSubtasks}/{totalSubtasks}</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all duration-300",
                                          subtaskProgress === 100
                                            ? "bg-emerald-500"
                                            : "bg-indigo-500"
                                        )}
                                        style={{ width: `${subtaskProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="mt-3 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                        priorityColor[task.priority]
                                      )}
                                    >
                                      {task.priority}
                                    </span>

                                    {/* Deadline warning badges */}
                                    {deadlineStatus === "overdue" && (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                        Overdue
                                      </span>
                                    )}
                                    {deadlineStatus === "due-soon" && (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                        <Clock className="h-2.5 w-2.5" />
                                        Due soon
                                      </span>
                                    )}
                                  </div>

                                  {task.deadline && !deadlineStatus && (
                                    <span className="text-[11px] text-slate-400">
                                      {new Date(task.deadline).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {/* Empty column hint */}
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-1 items-center justify-center py-6">
                        <p className="text-xs text-slate-400">Drop tasks here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
