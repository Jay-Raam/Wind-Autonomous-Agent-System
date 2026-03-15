import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface GenerateCompletionInput {
  prompt: string;
  provider?: 'openrouter' | 'openai' | 'local';
}

export class LlmService {
  async generateCompletion(input: GenerateCompletionInput): Promise<string> {
    const provider = input.provider ?? env.LLM_PROVIDER;

    if (provider === 'openrouter' && env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            ...(env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': env.OPENROUTER_SITE_URL } : {}),
            'X-Title': env.OPENROUTER_APP_NAME,
          },
          body: JSON.stringify({
            model: env.OPENROUTER_MODEL,
            messages: [{ role: 'user', content: input.prompt }],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter request failed with status ${response.status}`);
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        return data.choices?.[0]?.message?.content ?? 'No response generated.';
      } catch (error) {
        logger.warn({ err: error }, 'OpenRouter call failed, falling back to backup providers');
      }
    }

    if (provider === 'openai' && env.OPENAI_API_KEY) {
      try {
        const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: input.prompt }],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI request failed with status ${response.status}`);
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        return data.choices?.[0]?.message?.content ?? 'No response generated.';
      } catch (error) {
        logger.warn({ err: error }, 'OpenAI call failed, falling back to local model simulation');
      }
    }

    return `Local model response for: ${input.prompt.slice(0, 500)}`;
  }
}
