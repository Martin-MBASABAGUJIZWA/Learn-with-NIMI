import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = "mistralai/mistral-7b-instruct";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 300;

const SUPPORTED_LANGUAGES = ["english", "swahili", "french", "spanish", "kinyarwanda"];

export async function POST(req: NextRequest) {
  try {
    const { question, childName, language, role = "child", age } = await req.json();

    // Input validation
    if (!question || !childName || !language) {
      return NextResponse.json(
        { error: "Missing required fields: question, childName, or language" },
        { status: 400 }
      );
    }

    const langLower = language.toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(langLower)) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}` },
        { status: 400 }
      );
    }

    const isParent = role === "parent";

    // System prompt with combined strengths from both versions
    const systemPrompt = `
You are Nimi, a warm, friendly, and smart AI assistant that helps children and parents learn in a multilingual environment.

MUST FOLLOW THESE RULES:
1. Respond ONLY in: ${language.toUpperCase()}. Never switch languages or translate.
2. Always address the child by name: ${childName}.
3. Keep responses clear, concise, and appropriate for ${age ? `age ${age}` : "a child"}.
4. Adapt your tone based on the user:
   - With children: Use a simple, playful, and encouraging tone
   - With parents: Be respectful, helpful, and offer educational guidance

Focus on making learning engaging and accessible. Provide accurate information in a way that's easy to understand.
    `.trim();

    // User prompt with combined elements
    const userPrompt = isParent
      ? `Parent request for ${childName} (age ${age ?? "unknown"}):\n\n"${question}"\n\nPlease provide helpful guidance.`
      : `${childName}'s question (age ${age ?? "unknown"}):\n\n"${question}"`;

    // API call to OpenRouter
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
          { role: "user", content: userPrompt }
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`OpenRouter error [${res.status}]:`, errorText);
      return NextResponse.json(
        { error: "Failed to get response from AI service" },
        { status: 500 }
      );
    }

    const { choices } = await res.json();
    const answer = choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return NextResponse.json({ answer });

  } catch (err) {
    console.error("API handler error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}