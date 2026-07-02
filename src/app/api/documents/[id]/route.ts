import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CollabDocument from "@/models/Document";
import Workspace from "@/models/Workspace";
import { z } from "zod";

const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function getDocAndVerifyAccess(docId: string, userId: string) {
  await dbConnect();
  const doc = await CollabDocument.findById(docId);
  if (!doc) return { doc: null, workspace: null };

  const workspace = await Workspace.findOne({
    _id: doc.workspace,
    $or: [{ owner: userId }, { "members.user": userId }],
  });

  return { doc, workspace };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { doc, workspace } = await getDocAndVerifyAccess(id, session.user.id);

  if (!doc || !workspace) {
    return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
  }

  await doc.populate("createdBy", "name email image");
  await doc.populate("lastEditedBy", "name email image");
  await doc.populate("collaborators", "name email image");

  return NextResponse.json({
    success: true,
    data: {
      id: doc._id.toString(),
      title: doc.title,
      workspace: doc.workspace.toString(),
      content: doc.content,
      createdBy: doc.createdBy,
      lastEditedBy: doc.lastEditedBy,
      collaborators: doc.collaborators,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { doc, workspace } = await getDocAndVerifyAccess(id, session.user.id);

  if (!doc || !workspace) {
    return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid update data" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { lastEditedBy: session.user.id };
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.content !== undefined) updates.content = parsed.data.content;

  // Add current user to collaborators if not already there
  if (!doc.collaborators.map((c) => c.toString()).includes(session.user.id)) {
    updates.$addToSet = { collaborators: session.user.id };
  }

  const updated = await CollabDocument.findByIdAndUpdate(
    id,
    { $set: updates, ...(updates.$addToSet ? { $addToSet: updates.$addToSet } : {}) },
    { new: true, runValidators: true }
  )
    .populate("createdBy", "name email image")
    .populate("lastEditedBy", "name email image")
    .populate("collaborators", "name email image");

  return NextResponse.json({
    success: true,
    data: {
      id: updated!._id.toString(),
      title: updated!.title,
      workspace: updated!.workspace.toString(),
      content: updated!.content,
      createdBy: updated!.createdBy,
      lastEditedBy: updated!.lastEditedBy,
      collaborators: updated!.collaborators,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    },
    message: "Document saved",
  });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { doc, workspace } = await getDocAndVerifyAccess(id, session.user.id);

  if (!doc || !workspace) {
    return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
  }

  // Only creator or workspace owner can delete
  const isOwner =
    doc.createdBy.toString() === session.user.id ||
    workspace.owner.toString() === session.user.id;

  if (!isOwner) {
    return NextResponse.json(
      { success: false, error: "Only the document creator or workspace owner can delete this document" },
      { status: 403 }
    );
  }

  await CollabDocument.findByIdAndDelete(id);

  return NextResponse.json({ success: true, message: "Document deleted" });
}
