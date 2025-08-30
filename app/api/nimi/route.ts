// app/api/nimi/route.ts
import { NextRequest } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, language = 'en' } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cool, kid-friendly, curious system prompt
    const systemMessage = {
      role: 'system',
      content: `
You are Nimi, a super fun and friendly AI assistant for children aged 2-4.
Rules:
- Always respond in simple words a toddler can understand (1–3 short sentences).
- Be playful, curious, and encouraging.
- Use fun emojis 🎨✨ occasionally.
- Introduce new ideas, animals, colors, planets, or tiny facts in a fun way.
- Ask simple questions to keep the conversation going.
- Never repeat generic greetings like "Hello!" unless appropriate.
- Remember the conversation context to give personalized replies.
- Never give adult content or complex explanations.
- Always respond in ${language}, unless asked otherwise.
      `.trim(),
    };

    const payload = {
      model: 'openai/gpt-3.5-turbo',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 150,
      stream: true,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // more generous timeout

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenRouter API error:', text);
      return new Response(JSON.stringify({ error: 'AI service error', details: text }), { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data:') && !line.includes('[DONE]')) {
                try {
                  const data = JSON.parse(line.substring(5));
                  const content = data.choices?.[0]?.delta?.content;
                  if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                } catch (err) {
                  console.error("Error parsing chunk:", err);
                }
              }
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }), { status: 500 });
  }
}
