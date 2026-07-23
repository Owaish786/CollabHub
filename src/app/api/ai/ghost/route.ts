import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Message from "@/models/Message";
import Workspace from "@/models/Workspace";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/ai/ghost
 * 
 * The Ghost AI Project Manager analyzes a batch of recent messages
 * and autonomously creates tasks, assigns them, and sets deadlines.
 * 
 * Body: { workspaceId, channel, triggerMessageId }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  let body: { workspaceId?: string; channel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const { workspaceId, channel = "general" } = body;
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "workspaceId is required" }, { status: 400 });
  }

  await dbConnect();

  // Verify workspace membership
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  }).populate("members.user", "name email");

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  // Get last 15 messages for context
  const recentMessages = await Message.find({ workspace: workspaceId, channel })
    .sort({ createdAt: -1 })
    .limit(15)
    .populate("sender", "name email")
    .lean();

  if (recentMessages.length === 0) {
    return NextResponse.json({ success: true, actions: [], message: "No messages to analyze" });
  }

  // Build member list for the AI
  interface WorkspaceMember {
    user: { _id?: { toString(): string }; name?: string; email?: string };
  }
  const members = (workspace.members as WorkspaceMember[]).map((m) => ({
    id: m.user._id?.toString(),
    name: m.user.name,
    email: m.user.email,
  }));

  // Format messages for the AI
  const chatLog = recentMessages
    .reverse()
    .map((msg) => {
      const sender = msg.sender as unknown as { name?: string };
      return `[${sender.name ?? "Unknown"}]: ${msg.content}`;
    })
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `You are the Ghost AI Project Manager for a team workspace called "${workspace.name}".
Your job is to silently monitor team conversations and extract actionable tasks.

## Team Members
${members.map((m) => `- ${m.name} (${m.email})`).join("\n")}

## Today's Date
${today}

## Recent Chat Messages
${chatLog}

## Instructions
Analyze the conversation above. Extract any implied tasks, commitments, or action items.
For each task found, provide:
- "title": A concise task title (max 15 words)
- "description": Brief context from the conversation
- "assignee_name": The team member's name who should own this (based on who said they'd do it, or who it's most relevant to). If unclear, set to null.
- "priority": "low" | "medium" | "high" | "urgent"
- "deadline_offset_days": Number of days from today (e.g. 1 for tomorrow, 7 for next week). Set to null if no deadline was mentioned.

IMPORTANT RULES:
- Only extract REAL tasks. Do not fabricate tasks from casual greetings or small talk.
- If there are NO actionable items, return an empty array.
- Be conservative — only create tasks for clear commitments or requests.
- Return ONLY a valid JSON array, nothing else.

Example output:
[{"title": "Fix login page bug", "description": "Mentioned broken login flow", "assignee_name": "Alice", "priority": "high", "deadline_offset_days": 1}]`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const text = result.response.text();

    // Parse the JSON array
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    interface GhostTask {
      title: string;
      description?: string;
      assignee_name?: string | null;
      priority?: string;
      deadline_offset_days?: number | null;
    }
    const ghostTasks: GhostTask[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (ghostTasks.length === 0) {
      return NextResponse.json({ success: true, actions: [], message: "No actionable tasks found" });
    }

    // Create tasks in the database
    const createdTasks = [];
    for (const gt of ghostTasks) {
      // Match assignee by name
      let assigneeId: string | undefined;
      if (gt.assignee_name) {
        const match = members.find(
          (m) => m.name?.toLowerCase().includes(gt.assignee_name!.toLowerCase())
        );
        if (match) assigneeId = match.id;
      }

      // Calculate deadline
      let deadline: Date | undefined;
      if (gt.deadline_offset_days != null && gt.deadline_offset_days > 0) {
        deadline = new Date();
        deadline.setDate(deadline.getDate() + gt.deadline_offset_days);
      }

      // Get the current max order
      const maxOrder = await Task.findOne({ workspace: workspaceId, status: "todo" })
        .sort({ order: -1 })
        .select("order")
        .lean();
      const nextOrder = ((maxOrder as { order?: number } | null)?.order ?? 0) + 1;

      const task = await Task.create({
        title: gt.title,
        description: gt.description ?? "",
        workspace: workspaceId,
        status: "todo",
        priority: (gt.priority as "low" | "medium" | "high" | "urgent") ?? "medium",
        assignees: assigneeId ? [assigneeId] : [],
        deadline,
        labels: ["🤖 ghost-ai"],
        order: nextOrder,
        createdBy: session.user.id,
      });

      createdTasks.push({
        id: task._id.toString(),
        title: task.title,
        assignee: gt.assignee_name,
        priority: task.priority,
        deadline: deadline?.toISOString() ?? null,
      });
    }

    // Post a Ghost AI message in the chat
    if (createdTasks.length > 0) {
      const taskSummary = createdTasks
        .map(
          (t, i) =>
            `${i + 1}. **${t.title}**${t.assignee ? ` → ${t.assignee}` : ""}${
              t.deadline ? ` (due ${new Date(t.deadline).toLocaleDateString()})` : ""
            }`
        )
        .join("\n");

      await Message.create({
        workspace: workspaceId,
        channel,
        sender: session.user.id,
        content: `🤖 **Ghost AI** detected ${createdTasks.length} action item${createdTasks.length > 1 ? "s" : ""} from your conversation:\n\n${taskSummary}\n\n_Tasks have been added to your Kanban board automatically._`,
      });
    }

    return NextResponse.json({
      success: true,
      actions: createdTasks,
      message: `Created ${createdTasks.length} task(s) from conversation`,
    });
  } catch (error) {
    console.error("Ghost AI error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze conversation" },
      { status: 500 }
    );
  }
}
