import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ======================
// Environment Configuration
// ======================
const ENV = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Validate critical environment variables
if (!ENV.OPENROUTER_API_KEY || !ENV.SUPABASE_URL || !ENV.SUPABASE_KEY) {
  const missingVars = [
    !ENV.OPENROUTER_API_KEY && 'OPENROUTER_API_KEY',
    !ENV.SUPABASE_URL && 'SUPABASE_URL',
    !ENV.SUPABASE_KEY && 'SUPABASE_KEY'
  ].filter(Boolean);
  
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Supabase client with enhanced configuration
const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// ======================
// Constants & Configuration
// ======================
const AI_CONFIG = {
  DEFAULT_MODEL: "openai/gpt-3.5-turbo",
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 2
};

const LANGUAGE_CONFIG = {
  english: {
    greeting: "Hi",
    encouragement: ["Great job!", "Wow!", "Amazing!", "You're doing great!"],
    error: "Oops! Let's try again"
  },
  spanish: {
    greeting: "Hola",
    encouragement: ["¡Buen trabajo!", "¡Guau!", "¡Increíble!", "¡Lo estás haciendo genial!"],
    error: "¡Ups! Intentemos otra vez"
  },
  french: {
    greeting: "Bonjour",
    encouragement: ["Bravo !", "Wow !", "Incroyable !", "Tu te débrouilles très bien !"],
    error: "Oups ! Essayons encore"
  },
  swahili: {
    greeting: "Habari",
    encouragement: ["Kazi nzuri!", "Wow!", "Ajabu!", "Unafanya vizuri sana!"],
    error: "Oops! Tujaribu tena"
  },
  kinyarwanda: {
    greeting: "Mwaramutse",
    encouragement: ["Akazi neza!", "Wow!", "Bitangaza!", "Urakora neza!"],
    error: "Oops! Regeraho"
  }
};

// ======================
// Helper Functions
// ======================
async function withRetry<T>(fn: () => Promise<T>, retries = AI_CONFIG.MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * (AI_CONFIG.MAX_RETRIES - retries + 1)));
    return withRetry(fn, retries - 1);
  }
}

function generateSystemPrompt(params: {
  childName: string;
  language: string;
  isParent: boolean;
  isToddler: boolean;
  langConfig: typeof LANGUAGE_CONFIG[keyof typeof LANGUAGE_CONFIG];
  randomEncouragement: string;
}): string {
  const { childName, language, isParent, isToddler, langConfig, randomEncouragement } = params;
  
  return `
You are Nimi, a warm, friendly AI assistant for children ages 2-4.

Rules:
1. ALWAYS use ${language.toUpperCase()}.
2. Address the child as ${childName}.
3. Use VERY simple words (1-4 words for toddlers).
4. Use emojis and sounds ("Wow! 🌟", "Yay! 🎉").
5. Be extremely patient and encouraging.
6. ${isParent ? "Provide detailed explanations for parents." : "Keep responses playful and simple."}
7. For toddlers, use mostly emojis with few words.

${isParent ? "Parent Mode: Provide educational insights and activity suggestions." : ""}

Common responses:
- ${langConfig.greeting} ${childName}! 👋
- ${randomEncouragement}
- ${langConfig.error} 😊
`.trim();
}

// ======================
// Core API Functions
// ======================
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let requestData: any;
  
  try {
    // Parse and validate request
    requestData = await req.json();
    
    const { question, childName = "Friend", language = "english", age = "3", role = "child", userId } = requestData;

    if (!question?.trim()) {
      return NextResponse.json(
        { answer: "Please ask me a question! 😊", error: "EMPTY_QUESTION" },
        { status: 400 }
      );
    }

    // Validate language
    const supportedLanguages = Object.keys(LANGUAGE_CONFIG);
    const lang = supportedLanguages.includes(language.toLowerCase()) 
      ? language.toLowerCase() 
      : "english";

    const isParent = role === "parent";
    const isToddler = parseInt(age) <= 4;
    const langConfig = LANGUAGE_CONFIG[lang as keyof typeof LANGUAGE_CONFIG];
    const randomEncouragement = langConfig.encouragement[Math.floor(Math.random() * langConfig.encouragement.length)];

    // Generate AI response with retry logic
    const answer = await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://piko-preschool.vercel.app",
            "X-Title": "Piko Preschool"
          },
          body: JSON.stringify({
            model: AI_CONFIG.DEFAULT_MODEL,
            messages: [
              { 
                role: "system", 
                content: generateSystemPrompt({
                  childName,
                  language: lang,
                  isParent,
                  isToddler,
                  langConfig,
                  randomEncouragement
                })
              },
              { role: "user", content: question.trim() },
            ],
            temperature: isToddler ? 0.9 : AI_CONFIG.DEFAULT_TEMPERATURE,
            max_tokens: isToddler ? 50 : AI_CONFIG.DEFAULT_MAX_TOKENS,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`OpenRouter error: ${response.status} - ${errorBody}`);
        }

        const { choices } = await response.json();
        let answer = choices?.[0]?.message?.content?.trim() || `${langConfig.error} 😊`;

        if (isToddler) {
          answer = answer
            .replace(/(good job|great|wow|yay)/gi, (match) => 
              `${match} ${["🌟","🎉","👏","💖"][Math.floor(Math.random()*4)]}`)
            .substring(0, 50);
        }

        return answer;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    // Save to history in background if userId exists
    if (userId) {
      saveToHistory({
        userId,
        messages: [
          { content: question, role: 'user' },
          { content: answer, role: 'assistant' }
        ],
        language: lang,
        isToddler
      }).catch(error => {
        console.error("Background history save failed:", error);
      });
    }

    return NextResponse.json({ 
      answer,
      metadata: {
        language: lang,
        isToddler,
        processingTime: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error("API Failure:", {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: ENV.NODE_ENV === 'development' ? error.stack : undefined
      },
      request: {
        data: requestData,
        headers: Object.fromEntries(req.headers.entries())
      }
    });

    return NextResponse.json(
      { 
        answer: "I'm having some trouble thinking right now. Please try again soon! 🌟",
        error: "API_FAILURE",
        ...(ENV.NODE_ENV === 'development' && { debug: error.message })
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId || userId === 'undefined') {
      return NextResponse.json({ history: [] });
    }

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ 
      history: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error("History Fetch Error:", error);
    return NextResponse.json(
      { 
        error: "HISTORY_FETCH_FAILED",
        message: "Couldn't load chat history",
        ...(ENV.NODE_ENV === 'development' && { debug: error.message })
      },
      { status: 500 }
    );
  }
}

// ======================
// Database Operations
// ======================
async function saveToHistory(params: {
  userId: string;
  messages: Array<{ content: string; role: string }>;
  language: string;
  isToddler: boolean;
}) {
  const { userId, messages, language, isToddler } = params;
  
  const records = messages.map(message => ({
    user_id: userId,
    message: message.content,
    role: message.role,
    language,
    age_group: isToddler ? 'toddler' : 'child',
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('chat_history')
    .insert(records);

  if (error) {
    throw error;
  }
}