import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Message from "@/models/Message";
import Workspace from "@/models/Workspace";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/ai/digest
 * 
 * Generates a beautiful weekly digest summarizing the workspace activity.
 * Body: { workspaceId }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "Gemini API key not configured" }, { status: 500 });
  }

  let body: { workspaceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const { workspaceId } = body;
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "workspaceId is required" }, { status: 400 });
  }

  await dbConnect();

  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  }).populate("members.user", "name");

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  // Get activity from the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [completedTasks, newTasks, totalMessages, activeMembers] = await Promise.all([
    Task.countDocuments({
      workspace: workspaceId,
      status: "done",
      updatedAt: { $gte: oneWeekAgo },
    }),
    Task.countDocuments({
      workspace: workspaceId,
      createdAt: { $gte: oneWeekAgo },
    }),
    Message.countDocuments({
      workspace: workspaceId,
      createdAt: { $gte: oneWeekAgo },
    }),
    Message.distinct("sender", {
      workspace: workspaceId,
      createdAt: { $gte: oneWeekAgo },
    }),
  ]);

  // Get in-progress tasks
  const inProgressTasks = await Task.find({
    workspace: workspaceId,
    status: "in-progress",
  })
    .select("title assignees")
    .populate("assignees", "name")
    .limit(5)
    .lean();

  // Get overdue tasks
  const overdueTasks = await Task.find({
    workspace: workspaceId,
    status: { $ne: "done" },
    deadline: { $lt: new Date() },
  })
    .select("title deadline")
    .limit(5)
    .lean();

  interface WorkspaceMember {
    user: { name?: string };
  }
  const memberCount = (workspace.members as WorkspaceMember[]).length;

  const prompt = `You are the Ghost AI for a team workspace called "${workspace.name}".
Generate a friendly, concise weekly digest message. Use emoji tastefully.

## Stats for the Last 7 Days
- Tasks completed: ${completedTasks}
- New tasks created: ${newTasks}
- Messages sent: ${totalMessages}
- Active members: ${activeMembers.length} of ${memberCount}

## Currently In-Progress
${inProgressTasks.length > 0 ? inProgressTasks.map((t) => {
  const task = t as unknown as { title: string; assignees: Array<{ name?: string }> };
  return `- ${task.title} (${task.assignees.map((a) => a.name).join(", ") || "unassigned"})`;
}).join("\n") : "None"}

## Overdue Tasks
${overdueTasks.length > 0 ? overdueTasks.map((t) => {
  const task = t as unknown as { title: string; deadline: Date };
  return `- ${task.title} (due ${new Date(task.deadline).toLocaleDateString()})`;
}).join("\n") : "None — great job!"}

Write a 3-5 paragraph digest. Start with a greeting. Include the stats naturally.
Mention any blockers (overdue or stalled tasks). End with motivation.
Do NOT use markdown headers. Keep it chat-friendly.
Return ONLY the message text.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 512,
      },
    });

    const digestText = result.response.text();

    if (!digestText) {
      return NextResponse.json({ success: false, error: "Failed to generate digest" }, { status: 500 });
    }

    // Post the digest to the general channel
    const digestMessage = `📊 **Weekly Digest — ${workspace.name}**\n\n${digestText}`;

    await Message.create({
      workspace: workspaceId,
      channel: "general",
      sender: session.user.id,
      content: digestMessage,
    });

    return NextResponse.json({
      success: true,
      digest: digestMessage,
      stats: {
        completedTasks,
        newTasks,
        totalMessages,
        activeMemberCount: activeMembers.length,
        overdueCount: overdueTasks.length,
      },
    });
  } catch (error) {
    console.error("Digest generation error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate digest" }, { status: 500 });
  }
}
