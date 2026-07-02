import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import { updateWorkspaceSchema, inviteMemberSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ workspaceId: string }> };

async function getWorkspaceAndVerifyAccess(workspaceId: string, userId: string) {
  await dbConnect();
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: userId }, { "members.user": userId }],
  });
  return workspace;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await context.params;
  const workspace = await getWorkspaceAndVerifyAccess(workspaceId, session.user.id);

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: workspace._id.toString(),
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      owner: workspace.owner.toString(),
      members: workspace.members.map((m) => ({
        user: m.user.toString(),
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      settings: workspace.settings,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await context.params;

  await dbConnect();
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  // Only owner or admin can update settings
  const member = workspace.members.find((m) => m.user.toString() === session.user.id);
  const isOwner = workspace.owner.toString() === session.user.id;
  const isAdmin = member?.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = updateWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid update data" },
      { status: 400 }
    );
  }

  const updated = await Workspace.findByIdAndUpdate(
    workspaceId,
    { $set: parsed.data },
    { new: true, runValidators: true }
  );

  return NextResponse.json({
    success: true,
    data: {
      id: updated!._id.toString(),
      name: updated!.name,
      slug: updated!.slug,
      description: updated!.description,
    },
    message: "Workspace updated",
  });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await context.params;

  await dbConnect();
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  if (workspace.owner.toString() !== session.user.id) {
    return NextResponse.json(
      { success: false, error: "Only the workspace owner can delete it" },
      { status: 403 }
    );
  }

  await Workspace.findByIdAndDelete(workspaceId);

  // Remove workspace from all members' user records
  await User.updateMany(
    { workspaces: workspace._id },
    { $pull: { workspaces: workspace._id } }
  );

  return NextResponse.json({ success: true, message: "Workspace deleted" });
}

/**
 * POST /api/workspaces/[workspaceId]/members (invite)
 * Handled via a sub-route — this endpoint is not used directly.
 * Use /api/workspaces/[workspaceId]/members instead.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await context.params;

  await dbConnect();
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const isOwner = workspace.owner.toString() === session.user.id;
  const member = workspace.members.find((m) => m.user.toString() === session.user.id);
  const isAdmin = member?.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid invite data" },
      { status: 400 }
    );
  }

  const invitedUser = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!invitedUser) {
    return NextResponse.json(
      { success: false, error: "No account found with that email address" },
      { status: 404 }
    );
  }

  const alreadyMember = workspace.members.some(
    (m) => m.user.toString() === invitedUser._id.toString()
  );
  if (alreadyMember) {
    return NextResponse.json(
      { success: false, error: "User is already a member of this workspace" },
      { status: 409 }
    );
  }

  workspace.members.push({
    user: invitedUser._id,
    role: parsed.data.role,
    joinedAt: new Date(),
  });
  await workspace.save();

  await User.findByIdAndUpdate(invitedUser._id, {
    $addToSet: { workspaces: workspace._id },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        userId: invitedUser._id.toString(),
        name: invitedUser.name,
        email: invitedUser.email,
        role: parsed.data.role,
      },
      message: `${invitedUser.name} added to workspace`,
    },
    { status: 201 }
  );
}
