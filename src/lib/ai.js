/**
 * AI Client — calls server-side /api/chat proxy.
 *
 * API key is NEVER exposed to browser. Server reads from process.env (AI_API_KEY).
 */

import { t } from '../i18n/index.js';

const CONFIG_CACHE_KEY = 'jptea-ai-server-config';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

let cachedConfig = null;
let cachedAt = 0;

/**
 * Get public AI config from server (no API key)
 * Returns: { enabled, configured, provider?, model? }
 */
export async function getServerConfig() {
  // Cache to avoid repeated requests
  if (cachedConfig && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Config endpoint not available');
    cachedConfig = await res.json();
    cachedAt = Date.now();
    return cachedConfig;
  } catch (err) {
    cachedConfig = { enabled: false, configured: false, error: err.message };
    cachedAt = Date.now();
    return cachedConfig;
  }
}

/**
 * Synchronous check using cached config (call getServerConfig() first)
 */
export function isAIEnabledSync() {
  return cachedConfig?.enabled === true;
}

/**
 * Async version — fetches if not cached
 */
export async function isAIEnabled() {
  const cfg = await getServerConfig();
  return cfg.enabled === true;
}

/**
 * Send chat completion request to server proxy
 */
export async function chatCompletion(messages, options = {}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data.content || '';
}

/**
 * Pre-built prompts using current locale.
 * The system message tells AI which language to reply in.
 */
export const PROMPTS = {
  systemTutor: () => t('ai.systemTutor'),

  quizHint: (question, options) =>
    t('ai.quizHintUser', { question, options: options.join(', ') }),

  explainGrammar: (grammar) =>
    t('ai.explainGrammarUser', { grammar }),

  generateSentence: (word) =>
    t('ai.generateSentenceUser', { word }),

  correctPronunciation: (word) =>
    t('ai.pronunciationUser', { word }),
};

// Bootstrap: fetch config on import for synchronous isAIEnabled() checks
getServerConfig();
