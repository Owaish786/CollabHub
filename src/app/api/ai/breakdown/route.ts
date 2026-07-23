import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
      },
    });

    const text = result.response.text();

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
