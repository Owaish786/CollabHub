import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CollabDocument from "@/models/Document";
import Workspace from "@/models/Workspace";
import { createDocumentSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { success: false, error: "workspaceId query param is required" },
      { status: 400 }
    );
  }

  await dbConnect();

  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const documents = await CollabDocument.find({ workspace: workspaceId })
    .sort({ updatedAt: -1 })
    .populate("createdBy", "name email image")
    .populate("lastEditedBy", "name email image")
    .select("-yjsState"); // Don't send binary CRDT state in list view

  return NextResponse.json({
    success: true,
    data: documents.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      workspace: doc.workspace.toString(),
      content: doc.content,
      createdBy: doc.createdBy,
      lastEditedBy: doc.lastEditedBy,
      collaborators: doc.collaborators,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
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

  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid document data" },
      { status: 400 }
    );
  }

  await dbConnect();

  const workspace = await Workspace.findOne({
    _id: parsed.data.workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const document = await CollabDocument.create({
    title: parsed.data.title ?? "Untitled Document",
    workspace: parsed.data.workspaceId,
    content: "",
    createdBy: session.user.id,
    collaborators: [session.user.id],
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: document._id.toString(),
        title: document.title,
        workspace: document.workspace.toString(),
        content: document.content,
        createdBy: document.createdBy.toString(),
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
      message: "Document created successfully",
    },
    { status: 201 }
  );
}
