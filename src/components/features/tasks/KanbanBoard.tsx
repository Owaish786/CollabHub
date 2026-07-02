"use client";

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
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

interface Props {
  tasks: Task[];
  onReorder: (newTasks: Task[]) => void;
  onTaskClick: (task: Task) => void;
  onNewTask: (status: Task["status"]) => void;
}

export function KanbanBoard({ tasks, onReorder, onTaskClick, onNewTask }: Props) {
  const tasksByStatus = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const sourceStatus = source.droppableId as Task["status"];
    const destStatus = destination.droppableId as Task["status"];

    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex(t => t.id === draggableId);
    
    if (taskIndex === -1) return;

    // Update status
    newTasks[taskIndex].status = destStatus;

    // Get all tasks in destination column (excluding the moved task if it was already there)
    const destTasks = newTasks
      .filter(t => t.status === destStatus && t.id !== draggableId)
      .sort((a, b) => a.order - b.order);

    // Insert task at new index
    destTasks.splice(destination.index, 0, newTasks[taskIndex]);

    // Re-assign order for the affected column
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
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(drag, dragSnapshot) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            onClick={() => onTaskClick(task)}
                            className={cn(
                              "cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-shadow",
                              dragSnapshot.isDragging && "shadow-lg rotate-1"
                            )}
                          >
                            <p className="text-[13px] font-medium leading-snug text-slate-800">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-400">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  priorityColor[task.priority]
                                )}
                              >
                                {task.priority}
                              </span>
                              {task.deadline && (
                                <span className="text-[11px] text-slate-400">
                                  {new Date(task.deadline).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
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
