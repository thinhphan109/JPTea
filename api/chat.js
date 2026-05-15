/**
 * Vercel-style serverless function — POST /api/chat
 * Request body: { messages: [...], model?, temperature?, maxTokens? }
 * Response: { content: string } or { error: string }
 */
import { proxyChatCompletion } from '../server/ai-proxy.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, model, temperature, maxTokens } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    const content = await proxyChatCompletion(messages, { model, temperature, maxTokens });
    res.status(200).json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
