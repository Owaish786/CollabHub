import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";
import { createTaskSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const status = searchParams.get("status");
  const assignee = searchParams.get("assignee");

  if (!workspaceId) {
    return NextResponse.json(
      { success: false, error: "workspaceId query param is required" },
      { status: 400 }
    );
  }

  await dbConnect();

  // Verify user is a workspace member
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const filter: Record<string, unknown> = { workspace: workspaceId };
  if (status) filter.status = status;
  if (assignee) filter.assignees = assignee;

  const tasks = await Task.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .populate("assignees", "name email image")
    .populate("createdBy", "name email image");

  return NextResponse.json({
    success: true,
    data: tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      workspace: t.workspace.toString(),
      board: t.board?.toString(),
      status: t.status,
      priority: t.priority,
      assignees: t.assignees,
      deadline: t.deadline,
      comments: t.comments,
      subtasks: t.subtasks ?? [],
      coverColor: t.coverColor ?? null,
      labels: t.labels,
      order: t.order,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid task data" },
      { status: 400 }
    );
  }

  await dbConnect();

  // Verify user is a workspace member
  const workspace = await Workspace.findOne({
    _id: parsed.data.workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  // Auto-assign order (append to end of status column)
  const lastTask = await Task.findOne({
    workspace: parsed.data.workspaceId,
    status: parsed.data.status ?? "todo",
  }).sort({ order: -1 });

  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    workspace: parsed.data.workspaceId,
    status: parsed.data.status ?? "todo",
    priority: parsed.data.priority ?? "medium",
    assignees: parsed.data.assignees ?? [],
    deadline: parsed.data.deadline,
    labels: parsed.data.labels ?? [],
    subtasks: [],
    coverColor: undefined,
    order,
    createdBy: session.user.id,
  });

  return NextResponse.json(
    {
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
        subtasks: task.subtasks ?? [],
        coverColor: task.coverColor ?? null,
        labels: task.labels,
        order: task.order,
        createdBy: task.createdBy.toString(),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
      message: "Task created successfully",
    },
    { status: 201 }
  );
}
