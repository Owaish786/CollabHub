import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import { createWorkspaceSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  await dbConnect();

  const workspaces = await Workspace.find({
    $or: [
      { owner: session.user.id },
      { "members.user": session.user.id },
    ],
  }).sort({ updatedAt: -1 });

  return NextResponse.json({
    success: true,
    data: workspaces.map((workspace) => ({
      id: workspace._id.toString(),
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      owner: workspace.owner.toString(),
      members: workspace.members.map((member) => ({
        user: member.user.toString(),
        role: member.role,
        joinedAt: member.joinedAt,
      })),
      settings: workspace.settings,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }

  const parsed = createWorkspaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid workspace data",
      },
      { status: 400 }
    );
  }

  await dbConnect();

  const workspace = await Workspace.create({
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    owner: session.user.id,
    members: [
      {
        user: session.user.id,
        role: "owner",
        joinedAt: new Date(),
      },
    ],
  });

  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { workspaces: workspace._id },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
      },
      message: "Workspace created successfully",
    },
    { status: 201 }
  );
}