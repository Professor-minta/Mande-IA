export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface OpenRouterResponse {
  text: string;
  modelUsed: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenRouterProvider {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || null;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'MY_OPENROUTER_API_KEY';
  }

  public async generate(options: OpenRouterOptions): Promise<OpenRouterResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const {
      model = 'anthropic/claude-3.5-sonnet',
      messages,
      temperature = 0.7,
      maxTokens = 1500
    } = options;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'https://mande-ia.org',
          'X-Title': 'Mande-IA v2.0 Agent Platform'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          return {
            text,
            modelUsed: data?.model || model,
            usage: {
              promptTokens: data?.usage?.prompt_tokens || 0,
              completionTokens: data?.usage?.completion_tokens || 0,
              totalTokens: data?.usage?.total_tokens || 0
            }
          };
        }
      }
    } catch (err: any) {
      console.warn('OpenRouter call error, falling back to local/Gemini provider:', err?.message);
    }

    return null;
  }
}

export const openRouterProvider = new OpenRouterProvider();
