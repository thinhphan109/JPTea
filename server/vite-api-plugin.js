/**
 * Vite plugin — serve /api/* routes from ./api directory in dev mode.
 * Mimics Vercel's serverless functions for local development.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

export function apiRoutesPlugin() {
  return {
    name: 'api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        // Parse URL path → /api/chat → ./api/chat.js
        const urlPath = req.url.split('?')[0].replace(/\/$/, '');
        const filePath = resolve(process.cwd(), '.' + urlPath + '.js');

        if (!existsSync(filePath)) return next();

        try {
          // Dynamic import (cache-busted on file change)
          const mod = await server.ssrLoadModule(filePath);
          const handler = mod.default;
          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Handler not exported' }));
            return;
          }

          // Parse body for POST
          if (req.method === 'POST') {
            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', async () => {
              try {
                const raw = Buffer.concat(chunks).toString('utf-8');
                req.body = raw ? JSON.parse(raw) : {};
                wrapResponse(res);
                await handler(req, res);
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            wrapResponse(res);
            await handler(req, res);
          }
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

/** Add Vercel-like .status().json() helpers to res */
function wrapResponse(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
    return res;
  };
}
