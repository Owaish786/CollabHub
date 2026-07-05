import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace, { IWorkspaceMember } from "@/models/Workspace";
import Invite from "@/models/Invite";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find the invite
    const invite = await Invite.findOne({ token: params.token });
    if (!invite) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }

    // Check if expired or used
    if (invite.status !== "pending" || invite.isExpired) {
      if (invite.status === "pending") {
        invite.status = "expired";
        await invite.save();
      }
      return NextResponse.json(
        { error: "This invite link has expired or already been used" },
        { status: 400 }
      );
    }

    // If the invite was sent to a specific email, verify the user's email matches
    if (invite.email && session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }

    // Find the workspace
    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user is already a member
    const isAlreadyMember = workspace.members.some(
      (m: IWorkspaceMember) => m.user.toString() === session.user.id
    );

    if (isAlreadyMember) {
      // Mark as used just in case
      invite.status = "used";
      invite.usedAt = new Date();
      await invite.save();
      
      return NextResponse.json(
        { message: "You are already a member of this workspace", workspaceId: workspace._id },
        { status: 200 }
      );
    }

    // Add user to workspace
    workspace.members.push({
      user: session.user.id,
      role: invite.role,
      joinedAt: new Date(),
    });

    await workspace.save();

    // Mark invite as used
    // If it's a generic invite (no email), we might want to let multiple people use it
    // But for security, standard invites are usually single-use unless explicitly built as multi-use.
    // For now, we will mark ALL invites as used so they are single-use.
    invite.status = "used";
    invite.usedAt = new Date();
    await invite.save();

    return NextResponse.json(
      { 
        message: "Successfully joined the workspace",
        workspaceId: workspace._id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
