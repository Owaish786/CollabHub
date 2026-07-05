import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace, { IWorkspaceMember } from "@/models/Workspace";
import Invite from "@/models/Invite";
import crypto from "crypto";
import { sendWorkspaceInviteEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role = "member" } = await req.json();

    await dbConnect();

    // Verify the user is a member of the workspace with invite permissions
    const workspace = await Workspace.findById(params.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const currentMember = workspace.members.find(
      (m: IWorkspaceMember) => m.user.toString() === session.user.id
    );

    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return NextResponse.json(
        { error: "Only admins or owners can invite members" },
        { status: 403 }
      );
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invite
    const invite = await Invite.create({
      workspaceId: workspace._id,
      inviterId: session.user.id,
      email: email ? email.toLowerCase().trim() : undefined,
      token,
      role,
      expiresAt,
    });

    // Build the invite link
    const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const inviteLink = `${baseUrl}/invite/${token}`;

    // Send email if provided
    if (email) {
      void sendWorkspaceInviteEmail({
        to: email,
        inviterName: session.user.name || "A user",
        workspaceName: workspace.name,
        inviteLink,
      });
    }

    return NextResponse.json(
      {
        message: "Invite created successfully",
        inviteLink,
        invite: {
          id: invite._id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Verify workspace access
    const workspace = await Workspace.findById(params.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const currentMember = workspace.members.find(
      (m: IWorkspaceMember) => m.user.toString() === session.user.id
    );

    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return NextResponse.json(
        { error: "Only admins or owners can view invites" },
        { status: 403 }
      );
    }

    const invites = await Invite.find({ 
      workspaceId: workspace._id,
      status: "pending"
    }).sort({ createdAt: -1 });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Fetch invites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

