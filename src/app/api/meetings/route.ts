/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import Meeting from "@/models/Meeting";
import { MeetingParticipantStatus } from "@/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspace");
  const filter = searchParams.get("filter") || "all";

  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "workspaceId is required" }, { status: 400 });
  }

  await dbConnect();

  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const query: any = { workspace: workspaceId };
  const now = new Date();
  
  if (filter === "upcoming") {
    query.startTime = { $gt: now };
    query.status = { $in: ["upcoming", "live"] };
  } else if (filter === "past") {
    query.startTime = { $lte: now };
    query.status = { $in: ["ended", "cancelled"] };
  } else if (filter === "today") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    query.startTime = { $gte: startOfToday, $lt: endOfToday };
  }

  try {
    const meetings = await Meeting.find(query)
      .populate("organizer", "name email image")
      .populate("participants.user", "name email image")
      .sort({ startTime: 1 })
      .lean();

    return NextResponse.json({ success: true, data: meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const { title, description, workspaceId, startTime, endTime, participants, type } = body;

  if (!title || !workspaceId || !startTime || !endTime) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
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

  try {
    const randomSlug = Math.random().toString(36).substring(2, 10);
    const meetingLink = `/workspace/${workspaceId}/meetings/${randomSlug}`;

    const formattedParticipants = Array.isArray(participants)
      ? participants.map((id: string) => ({
          user: id as any,
          status: (id === session.user.id ? "accepted" : "pending") as MeetingParticipantStatus,
        }))
      : [{ user: session.user.id as any, status: "accepted" as MeetingParticipantStatus }];

    const meeting = await Meeting.create({
      title,
      description: description || "",
      workspace: workspaceId,
      organizer: session.user.id,
      participants: formattedParticipants,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      meetingLink,
      type: type || "scheduled",
      status: type === "quick" ? "live" : "upcoming",
    });

    const populatedMeeting = await Meeting.findById((meeting as any)._id)
      .populate("organizer", "name email image")
      .populate("participants.user", "name email image")
      .lean();

    return NextResponse.json({ success: true, data: populatedMeeting });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
