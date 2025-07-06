// app/api/nimi/route.ts
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: NextRequest) {
  const { question, childName, language } = await req.json();
  if (!question || !childName) {
    return NextResponse.json({ error: "Missing question or childName" }, { status: 400 });
  }

  const prompt = `You are Nimi, a friendly AI assistant helping children learn. Always address the child by name: ${childName}. Respond in ${language}.\n\nQ: ${question}\nA:`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // free model
        messages: [
          { role: "system", content: "You are Nimi, a kind, fun assistant for children and parents." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenRouter error:", res.status, text);
      return NextResponse.json({ error: `Inference failed: ${res.status}` }, { status: 500 });
    }

    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't find an answer.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Nimi AI error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
