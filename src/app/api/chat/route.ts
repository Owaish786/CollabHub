import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Workspace from "@/models/Workspace";
import { sendMessageSchema } from "@/lib/validators";

interface PopulatedUser {
  _id?: { toString(): string };
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

/**
 * GET /api/chat?workspaceId=...&channel=general&before=<cursor>&limit=50
 * Returns paginated messages for a workspace channel (newest-first).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const channel = searchParams.get("channel") ?? "general";
  const before = searchParams.get("before"); // ISO timestamp cursor for pagination
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

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

  const filter: Record<string, unknown> = {
    workspace: workspaceId,
    channel,
  };

  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "name email image")
    .populate("replyTo");

  return NextResponse.json({
    success: true,
    data: messages.reverse().map((m) => {
      const senderObj = m.sender as unknown as PopulatedUser;
      return {
        id: m._id.toString(),
        workspace: m.workspace.toString(),
        channel: m.channel,
        sender: {
          id: senderObj._id?.toString() || senderObj.id,
          name: senderObj.name,
          email: senderObj.email,
          image: senderObj.image,
        },
        content: m.content,
        attachments: m.attachments,
        reactions: m.reactions,
        replyTo: m.replyTo,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    }),
    hasMore: messages.length === limit,
  });
}

/**
 * POST /api/chat
 * Send a message to a workspace channel.
 */
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

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid message data" },
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

  const message = await Message.create({
    workspace: parsed.data.workspaceId,
    channel: parsed.data.channel,
    sender: session.user.id,
    content: parsed.data.content,
    replyTo: parsed.data.replyTo ?? undefined,
  });

  const populated = await message.populate("sender", "name email image");
  const senderObj = populated.sender as unknown as PopulatedUser;

  return NextResponse.json(
    {
      success: true,
      data: {
        id: populated._id.toString(),
        workspace: populated.workspace.toString(),
        channel: populated.channel,
        sender: {
          id: senderObj._id?.toString() || senderObj.id,
          name: senderObj.name,
          email: senderObj.email,
          image: senderObj.image,
        },
        content: populated.content,
        attachments: populated.attachments,
        reactions: populated.reactions,
        replyTo: populated.replyTo,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
      message: "Message sent",
    },
    { status: 201 }
  );
}
