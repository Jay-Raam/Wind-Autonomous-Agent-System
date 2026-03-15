import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface GenerateCompletionInput {
  prompt: string;
  provider?: 'gemini' | 'openrouter' | 'openai' | 'local';
}

export interface CompletionTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CompletionResult {
  text: string;
  tokenUsage: CompletionTokenUsage;
}

const ZERO_USAGE: CompletionTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

export class LlmService {
  async generateCompletion(input: GenerateCompletionInput): Promise<CompletionResult> {
    const provider = input.provider ?? env.LLM_PROVIDER;
    const providerOrder = [provider, 'gemini', 'openrouter', 'openai', 'local'].filter(
      (candidate, index, items) => items.indexOf(candidate) === index,
    ) as Array<GenerateCompletionInput['provider']>;

    for (const currentProvider of providerOrder) {
      if (currentProvider === 'gemini' && env.GEMINI_API_KEY) {
        try {
          const response = await fetch(
            `${env.GEMINI_BASE_URL}/models/${env.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: input.prompt }],
                  },
                ],
                generationConfig: {
                  temperature: 0.2,
                },
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`Gemini request failed with status ${response.status}`);
          }

          const data = (await response.json()) as {
            candidates?: Array<{
              content?: {
                parts?: Array<{ text?: string }>;
              };
            }>;
            usageMetadata?: {
              promptTokenCount?: number;
              candidatesTokenCount?: number;
              totalTokenCount?: number;
            };
          };

          const content =
            data.candidates?.[0]?.content?.parts
              ?.map((part) => part.text ?? '')
              .join('')
              .trim() ?? '';

          if (content) {
            return {
              text: content,
              tokenUsage: {
                promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
                totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
              },
            };
          }

          throw new Error('Gemini returned an empty response');
        } catch (error) {
          logger.warn({ err: error }, 'Gemini call failed, falling back to backup providers');
        }
      }

      if (currentProvider === 'openrouter' && env.OPENROUTER_API_KEY) {
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
            usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
          };

          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            return {
              text: content,
              tokenUsage: {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
              },
            };
          }

          throw new Error('OpenRouter returned an empty response');
        } catch (error) {
          logger.warn({ err: error }, 'OpenRouter call failed, falling back to backup providers');
        }
      }

      if (currentProvider === 'openai' && env.OPENAI_API_KEY) {
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
            usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
          };

          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            return {
              text: content,
              tokenUsage: {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
              },
            };
          }

          throw new Error('OpenAI returned an empty response');
        } catch (error) {
          logger.warn({ err: error }, 'OpenAI call failed, falling back to local model simulation');
        }
      }

      if (currentProvider === 'local') {
        return { text: `Local model response for: ${input.prompt.slice(0, 500)}`, tokenUsage: ZERO_USAGE };
      }
    }

    return { text: `Local model response for: ${input.prompt.slice(0, 500)}`, tokenUsage: ZERO_USAGE };
  }
}
