import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";

export async function POST(
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

  const { status } = body;
  if (!["accepted", "declined"].includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid RSVP status" }, { status: 400 });
  }

  await dbConnect();

  try {
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Find the participant entry for the current user
    const participant = meeting.participants.find(
      (p) => p.user.toString() === session.user.id
    );

    if (!participant) {
      // If not strictly invited but in workspace, they can still RSVP if they want, 
      // so let's add them to the participants list.
      meeting.participants.push({
        user: session.user.id as any,
        status: status as any,
      });
    } else {
      participant.status = status as any;
    }

    await meeting.save();

    const updatedMeeting = await Meeting.findById(id)
      .populate("organizer", "name email image")
      .populate("participants.user", "name email image")
      .lean();

    return NextResponse.json({ success: true, data: updatedMeeting });
  } catch (error) {
    console.error("Error processing RSVP:", error);
    return NextResponse.json({ success: false, error: "Failed to process RSVP" }, { status: 500 });
  }
}
