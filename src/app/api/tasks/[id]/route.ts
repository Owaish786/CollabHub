import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().optional(),
  status: z.enum(["todo", "in-progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignees: z.array(z.string()).optional(),
  deadline: z.string().datetime().nullable().optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional(),
  subtasks: z.array(z.object({
    id: z.string(),
    text: z.string().trim().min(1).max(300),
    completed: z.boolean(),
  })).optional(),
  coverColor: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function getTaskAndVerifyAccess(taskId: string, userId: string) {
  await dbConnect();
  const task = await Task.findById(taskId);
  if (!task) return { task: null, workspace: null };

  const workspace = await Workspace.findOne({
    _id: task.workspace,
    $or: [{ owner: userId }, { "members.user": userId }],
  });

  return { task, workspace };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { task, workspace } = await getTaskAndVerifyAccess(id, session.user.id);

  if (!task || !workspace) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  await task.populate("assignees", "name email image");
  await task.populate("createdBy", "name email image");

  return NextResponse.json({
    success: true,
    data: {
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      workspace: task.workspace.toString(),
      status: task.status,
      priority: task.priority,
      assignees: task.assignees,
      deadline: task.deadline,
      comments: task.comments,
      labels: task.labels,
      order: task.order,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { task, workspace } = await getTaskAndVerifyAccess(id, session.user.id);

  if (!task || !workspace) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid update data" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  const data = parsed.data;
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.assignees !== undefined) updates.assignees = data.assignees;
  if (data.deadline !== undefined) updates.deadline = data.deadline ? new Date(data.deadline) : null;
  if (data.labels !== undefined) updates.labels = data.labels;
  if (data.order !== undefined) updates.order = data.order;
  if (data.subtasks !== undefined) updates.subtasks = data.subtasks;
  if (data.coverColor !== undefined) updates.coverColor = data.coverColor;

  const updated = await Task.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate("assignees", "name email image")
    .populate("createdBy", "name email image");

  return NextResponse.json({
    success: true,
    data: {
      id: updated!._id.toString(),
      title: updated!.title,
      description: updated!.description,
      workspace: updated!.workspace.toString(),
      status: updated!.status,
      priority: updated!.priority,
      assignees: updated!.assignees,
      deadline: updated!.deadline,
      comments: updated!.comments,
      subtasks: updated!.subtasks ?? [],
      coverColor: updated!.coverColor ?? null,
      labels: updated!.labels,
      order: updated!.order,
      createdBy: updated!.createdBy,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    },
    message: "Task updated",
  });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { task, workspace } = await getTaskAndVerifyAccess(id, session.user.id);

  if (!task || !workspace) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  await Task.findByIdAndDelete(id);

  return NextResponse.json({ success: true, message: "Task deleted" });
}
