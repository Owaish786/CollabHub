import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Groq from "groq-sdk";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Groq API key not configured" },
      { status: 500 }
    );
  }

  let body: { title?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const { title, description } = body;
  if (!title) {
    return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
  }

  const prompt = `You are a project management assistant. Given the following task, break it down into 4-6 actionable subtasks. Each subtask should be a short, clear action item (max 10 words).

Task Title: ${title}
${description ? `Task Description: ${description}` : ""}

Return ONLY a JSON array of strings, nothing else. Example: ["Design the UI mockup", "Write API endpoint", "Add unit tests"]`;

  try {
    const groq = new Groq({ apiKey });
    
    const result = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 256,
    });

    const text = result.choices[0]?.message?.content || "";

    // Extract JSON array from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    const suggestions: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error("AI breakdown error:", error);
    return NextResponse.json(
      { success: false, error: "AI service unavailable" },
      { status: 502 }
    );
  }
}
