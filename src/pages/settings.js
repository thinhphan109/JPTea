/**
 * Settings page — server AI config status (read-only)
 *
 * Architecture: API key lives on SERVER only. This page just shows current
 * server config and explains how admin can change it via env vars.
 */
import { initTheme } from '../lib/theme.js';
import { getServerConfig, chatCompletion } from '../lib/ai.js';
import { renderHeader, bindHeaderEvents } from '../components/header.js';
import { mountSakura } from '../components/sakura.js';

initTheme();
mountSakura();

async function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderHeader({ backUrl: '/', backText: '← Trang chủ' })}
    <main class="container container--narrow" style="padding-top: var(--space-8); padding-bottom: var(--space-16);">
      <h1 style="margin-bottom: var(--space-2);">⚙️ Cài đặt AI</h1>
      <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">
        Trạng thái AI provider của hệ thống.
      </p>
      <div id="config-display"><div class="status-msg status-msg--info">⏳ Đang kiểm tra trạng thái AI...</div></div>
    </main>
  `;
  bindHeaderEvents();

  const config = await getServerConfig();
  renderConfigStatus(config);
}

function renderConfigStatus(config) {
  const area = document.getElementById('config-display');

  if (!config.configured) {
    area.innerHTML = `
      <div class="form-section">
        <div class="form-section__title">🔌 Trạng thái: <span style="color: var(--color-wrong);">Chưa cấu hình</span></div>
        <div class="form-section__desc">
          AI chưa được kích hoạt trên server. Tính năng 💡 Gợi ý sẽ không hiện trong quiz.
        </div>
      </div>

      ${renderSetupGuide()}
    `;
    return;
  }

  area.innerHTML = `
    <div class="form-section">
      <div class="form-section__title">
        🟢 Trạng thái: <span style="color: var(--color-correct);">Đang hoạt động</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: var(--space-3);">
        <tr>
          <td style="padding: var(--space-2) 0; color: var(--color-text-secondary); width: 30%;">Provider</td>
          <td style="padding: var(--space-2) 0; font-weight: var(--weight-medium);">${escapeHtml(config.provider || '?')}</td>
        </tr>
        <tr>
          <td style="padding: var(--space-2) 0; color: var(--color-text-secondary);">Model</td>
          <td style="padding: var(--space-2) 0; font-family: var(--font-mono, monospace); font-size: var(--text-sm);">${escapeHtml(config.model || '?')}</td>
        </tr>
        <tr>
          <td style="padding: var(--space-2) 0; color: var(--color-text-secondary);">API Key</td>
          <td style="padding: var(--space-2) 0; color: var(--color-text-muted);">🔒 Lưu trên server (không expose)</td>
        </tr>
      </table>

      <div class="form-actions">
        <button class="btn btn--primary" id="btn-test">🧪 Test kết nối</button>
      </div>
      <div id="status-area"></div>
    </div>

    ${renderSetupGuide()}
  `;

  document.getElementById('btn-test').addEventListener('click', testConnection);
}

function renderSetupGuide() {
  return `
    <div class="form-section">
      <div class="form-section__title">📖 Cách thay đổi cấu hình</div>
      <div class="form-section__desc">
        API key được lưu trên server qua biến môi trường (env vars). Để thay đổi:
      </div>

      <h4 style="margin-top: var(--space-4); margin-bottom: var(--space-2); font-size: var(--text-sm);">Local development</h4>
      <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-3);">
        Tạo file <code>.env</code> ở root project:
      </p>
      <pre style="background: var(--color-bg-elevated); padding: var(--space-4); border-radius: var(--radius-lg); font-size: var(--text-xs); overflow-x: auto; line-height: 1.7;"><code>AI_PROVIDER=groq
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
AI_MODEL=llama-3.1-8b-instant
AI_ENABLED=true</code></pre>
      <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-2);">
        Restart <code>npm run dev</code> sau khi thêm/sửa.
      </p>

      <h4 style="margin-top: var(--space-5); margin-bottom: var(--space-2); font-size: var(--text-sm);">Production (Vercel/Netlify)</h4>
      <p style="font-size: var(--text-sm); color: var(--color-text-secondary);">
        Thêm các biến env trên trong dashboard hosting (Settings → Environment Variables). Redeploy để áp dụng.
      </p>

      <h4 style="margin-top: var(--space-5); margin-bottom: var(--space-2); font-size: var(--text-sm);">Provider khả dụng</h4>
      <ul style="font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.9; padding-left: var(--space-5);">
        <li><strong>groq</strong> — <a href="https://console.groq.com/keys" target="_blank">Free tier, nhanh, recommended</a></li>
        <li><strong>openai</strong> — <a href="https://platform.openai.com/api-keys" target="_blank">Trả phí, GPT-4/3.5</a></li>
        <li><strong>openrouter</strong> — <a href="https://openrouter.ai/keys" target="_blank">Nhiều model, có free</a></li>
        <li><strong>together</strong> — <a href="https://api.together.xyz/settings/api-keys" target="_blank">$25 free credit</a></li>
        <li><strong>ollama</strong> — Local, không cần key. AI_BASE_URL=http://localhost:11434/v1</li>
        <li><strong>custom</strong> — Bất kỳ endpoint OpenAI-compatible nào (vLLM, LM Studio, LocalAI)</li>
      </ul>
    </div>

    <div class="form-section">
      <div class="form-section__title">🔒 Bảo mật</div>
      <div class="form-section__desc">
        ✓ API key chỉ tồn tại trên server, không gửi xuống browser.<br/>
        ✓ Browser gọi <code>/api/chat</code>, server proxy đến provider.<br/>
        ✓ Không có key trong DevTools, network tab, hay localStorage.
      </div>
    </div>
  `;
}

async function testConnection() {
  const btn = document.getElementById('btn-test');
  const area = document.getElementById('status-area');
  btn.disabled = true;
  btn.innerHTML = '⏳ Đang test...';
  area.innerHTML = '<div class="status-msg status-msg--info">⏳ Đang gọi AI...</div>';

  try {
    const reply = await chatCompletion([
      { role: 'user', content: 'Reply with just "OK" in one word.' }
    ], { maxTokens: 10, temperature: 0 });
    area.innerHTML = `<div class="status-msg status-msg--success">✅ AI hoạt động. Trả lời: "${escapeHtml(reply.trim())}"</div>`;
  } catch (err) {
    area.innerHTML = `<div class="status-msg status-msg--error">❌ ${escapeHtml(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🧪 Test kết nối';
  }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

render();
