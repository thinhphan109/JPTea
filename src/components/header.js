/**
 * Shared header component with theme + sound toggle
 */
import { toggleTheme, getTheme } from '../lib/theme.js';

const SOUND_KEY = 'jptea-sound-enabled';

function getSoundEnabled() {
  try { return localStorage.getItem(SOUND_KEY) !== 'false'; } catch { return true; }
}

function setSoundEnabled(v) {
  try { localStorage.setItem(SOUND_KEY, String(v)); } catch {}
}

export function renderHeader({ backUrl = '/', backText = '← Trang chủ', showThemeToggle = true, showSoundToggle = true } = {}) {
  const theme = getTheme();
  const themeIcon = theme === 'dark' ? '☀️' : '🌙';
  const soundIcon = getSoundEnabled() ? '🔊' : '🔇';

  return `
    <header class="header">
      <div class="container header__inner">
        <a href="${backUrl}" class="btn btn--back">${backText}</a>
        <a href="/" class="header__logo">🍵 <span>JP</span>Tea</a>
        <div class="header__actions">
          ${showSoundToggle ? `<button class="btn-icon" id="sound-toggle" aria-label="Bật/tắt âm thanh" title="Bật/tắt âm thanh">${soundIcon}</button>` : ''}
          <a href="/settings.html" class="btn-icon" aria-label="Cài đặt AI" title="Cài đặt AI">⚙️</a>
          ${showThemeToggle ? `<button class="btn-icon" id="theme-toggle" aria-label="Toggle theme">${themeIcon}</button>` : ''}
        </div>
      </div>
    </header>
  `;
}

export function bindHeaderEvents() {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = toggleTheme();
      themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }

  const soundBtn = document.getElementById('sound-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const newVal = !getSoundEnabled();
      setSoundEnabled(newVal);
      soundBtn.textContent = newVal ? '🔊' : '🔇';
      // Notify any listening pages (quiz reads sound state on each answer)
      window.dispatchEvent(new CustomEvent('soundtoggle', { detail: { enabled: newVal } }));
    });
  }
}
