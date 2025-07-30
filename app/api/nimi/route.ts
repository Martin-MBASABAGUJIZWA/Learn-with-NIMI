import { NextRequest } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return new Response('Missing OpenRouter API key', { status: 500 });
    }

    const { messages, childName = "friend", language = "en" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages array in request body', { status: 400 });
    }

    const systemMessage = {
      role: 'system',
      content: `You are Nimi, a friendly assistant for young children and their parents. Always reply in ${language}. Use simple, caring language to help ${childName} learn or feel motivated.`,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [systemMessage, ...messages],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return new Response(`OpenRouter API error: ${errorText}`, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Oops! I couldn't think of a good answer.";

    return new Response(JSON.stringify({ response: reply }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in /api/nimi:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
