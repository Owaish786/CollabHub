import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";
import { z } from "zod";

const commentSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid comment data" },
      { status: 400 }
    );
  }

  await dbConnect();
  
  const task = await Task.findById(id);
  if (!task) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  const workspace = await Workspace.findOne({
    _id: task.workspace,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Task not found or access denied" }, { status: 404 });
  }

  const newComment = {
    user: session.user.id,
    text: parsed.data.text,
    createdAt: new Date(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task.comments.push(newComment as any);
  await task.save();
  await task.populate("comments.user", "name email image");

  const addedComment = task.comments[task.comments.length - 1];

  return NextResponse.json(
    { success: true, data: addedComment, message: "Comment added successfully" },
    { status: 201 }
  );
}
