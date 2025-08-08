import { NextRequest } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const runtime = 'edge'; // Use Edge runtime for better performance

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { messages, childName = "friend", language = "en" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // System message to guide the AI's behavior
    const systemMessage = {
      role: 'system',
      content: `
        You are Nimi, a friendly AI assistant for children aged 3-10 and their parents. 
        You are talking to ${childName}. Follow these guidelines:
        - Use simple, clear language appropriate for young children
        - Be encouraging, positive, and patient
        - Keep responses concise (1-2 short sentences usually)
        - Relate to creativity, art, and learning
        - Use emojis occasionally to make it fun 🎨✨
        - Respond in ${language} unless asked otherwise
        - If unsure, ask a question to keep the conversation going
      `.trim()
    };

    const payload = {
      model: 'openai/gpt-3.5-turbo',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 150,
      stream: true
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.nextUrl.origin,
        'X-Title': 'PikoPal'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Error communicating with AI service',
        details: errorData 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        try {
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader available');

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
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Unexpected error in /api/nimi:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}