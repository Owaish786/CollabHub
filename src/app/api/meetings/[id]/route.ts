import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import Meeting from "@/models/Meeting";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await dbConnect();

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId 
      ? { _id: id } 
      : { meetingLink: { $regex: new RegExp(`${id}$`) } };

    const meeting = await Meeting.findOne(query)
      .populate("organizer", "name email image")
      .populate("participants.user", "name email image")
      .lean();

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    const workspace = await Workspace.findOne({
      _id: meeting.workspace,
      $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch meeting" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  await dbConnect();

  try {
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.organizer.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Only organizer can edit" }, { status: 403 });
    }

    // Allow updating specific fields
    const { title, description, startTime, endTime, status } = body;
    
    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (startTime) meeting.startTime = new Date(startTime);
    if (endTime) meeting.endTime = new Date(endTime);
    if (status) meeting.status = status;

    await meeting.save();

    const updatedMeeting = await Meeting.findById(id)
      .populate("organizer", "name email image")
      .populate("participants.user", "name email image")
      .lean();

    return NextResponse.json({ success: true, data: updatedMeeting });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json({ success: false, error: "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await dbConnect();

  try {
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.organizer.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Only organizer can delete" }, { status: 403 });
    }

    await Meeting.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json({ success: false, error: "Failed to delete meeting" }, { status: 500 });
  }
}
