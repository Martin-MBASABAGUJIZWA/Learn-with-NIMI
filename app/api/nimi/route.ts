import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const DEFAULT_MODEL = "openai/gpt-3.5-turbo";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1000;

export async function POST(req: NextRequest) {
  try {
    const { question, childName = "Friend", language = "english", age = "7", role = "child" } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Missing required field: question" }, { status: 400 });
    }

    const isParent = role === "parent";

    const systemPrompt = `
You are Nimi, a warm, friendly, and smart AI assistant that helps children learn.

Rules:
1. ALWAYS respond in this language: ${language.toUpperCase()}.
2. Address the child by name: ${childName}.
3. Use a fun, clear, encouraging tone appropriate for age ${age}.
4. Keep answers simple and engaging.

Make learning magical and easy in the child's language.
`.trim();

    const userPrompt = isParent
      ? `Parent request for ${childName} (age ${age}):\n\n"${question}"`
      : `${childName}'s question (age ${age}):\n\n"${question}"`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`OpenRouter error [${res.status}]:`, errorText);
      return NextResponse.json({ error: "AI service failed to respond" }, { status: 500 });
    }

    const { choices } = await res.json();
    const answer = choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't think of an answer.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("API handler error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
