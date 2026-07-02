import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";
import { z } from "zod";

const reorderSchema = z.object({
  workspaceId: z.string(),
  tasks: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["todo", "in-progress", "review", "done"]),
      order: z.number(),
    })
  ),
});

export async function PUT(request: NextRequest) {
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

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid reorder data" },
      { status: 400 }
    );
  }

  const { workspaceId, tasks } = parsed.data;

  await dbConnect();

  // Verify access to workspace
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found or access denied" }, { status: 404 });
  }

  // Bulk update
  const bulkOps = tasks.map((t) => ({
    updateOne: {
      filter: { _id: t.id, workspace: workspaceId },
      update: { $set: { status: t.status, order: t.order } },
    },
  }));

  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }

  return NextResponse.json({ success: true, message: "Tasks reordered successfully" });
}
