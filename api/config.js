/**
 * GET /api/config — returns public AI config (no key)
 */
import { getPublicConfig } from '../server/ai-proxy.js';

export default function handler(req, res) {
  res.status(200).json(getPublicConfig());
}
