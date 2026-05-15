/**
 * Server-side AI proxy — keeps API key on server.
 * Compatible with Vercel/Netlify serverless functions and Vite dev middleware.
 *
 * Reads from server env (NOT VITE_*):
 *   AI_PROVIDER, AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_ENABLED
 */

const PROVIDER_DEFAULTS = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  together: 'https://api.together.xyz/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  ollama: 'http://localhost:11434/v1',
};

/**
 * Get server config from env. Returns null if not configured.
 */
export function getServerConfig() {
  const env = process.env;
  const provider = env.AI_PROVIDER || 'groq';
  const baseUrl = env.AI_BASE_URL || PROVIDER_DEFAULTS[provider] || '';
  const apiKey = env.AI_API_KEY || '';
  const model = env.AI_MODEL || '';
  const enabled = env.AI_ENABLED === 'true';

  if (!enabled || !baseUrl) return null;
  // Ollama doesn't need API key, others do
  if (provider !== 'ollama' && !apiKey) return null;
  if (!model) return null;

  return { provider, baseUrl, apiKey, model, enabled };
}

/**
 * Proxy chat completion to AI provider, force non-streaming
 */
export async function proxyChatCompletion(messages, options = {}) {
  const config = getServerConfig();
  if (!config) {
    throw new Error('AI chưa được cấu hình trên server. Admin cần set AI_API_KEY và AI_ENABLED=true.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model || config.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 500,
      stream: false,
    }),
  });

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(tryParseError(rawText) || `HTTP ${res.status}`);
  }

  const data = parseResponse(rawText);
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Get public info about server AI config (NO API key)
 */
export function getPublicConfig() {
  const config = getServerConfig();
  if (!config) return { enabled: false, configured: false };
  return {
    enabled: true,
    configured: true,
    provider: config.provider,
    model: config.model,
  };
}

function parseResponse(text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty response from AI');
  try { return JSON.parse(trimmed); } catch {}
  // SSE fallback
  const lines = trimmed.split('\n').filter(l => l.startsWith('data:'));
  if (lines.length === 0) throw new Error('Invalid response: ' + trimmed.slice(0, 100));
  let content = '';
  for (const line of lines) {
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') continue;
    try {
      const obj = JSON.parse(payload);
      content += obj.choices?.[0]?.delta?.content || obj.choices?.[0]?.message?.content || '';
    } catch {}
  }
  return { choices: [{ message: { content } }] };
}

function tryParseError(text) {
  try {
    const obj = JSON.parse(text);
    return obj.error?.message || obj.message || null;
  } catch {
    return text.slice(0, 200);
  }
}
