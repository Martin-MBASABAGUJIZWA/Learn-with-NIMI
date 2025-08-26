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
    const { messages, childName = "friend", language = "en" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enhanced system prompt for clear, concise, helpful answers
    const systemMessage = {
      role: 'system',
      content: `
You are Nimi, a friendly and clear AI assistant for children aged 2-4 and their parents.
Your replies must be:
- Clear, concise, and to the point (1-3 short sentences)
- Positive, encouraging, and fun
- Easy for a young child to understand
- Include emojis occasionally to make it lively 🎨✨
- Ask a simple question to keep the conversation going if appropriate
- Always respond in ${language}, unless asked otherwise
- Avoid unnecessary long explanations or filler words
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
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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

    // Streaming the response
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
    return new Response(JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }), { status: 500 });
  }
}
