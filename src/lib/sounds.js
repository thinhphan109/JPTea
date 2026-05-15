/**
 * Sound effects — Web Audio API synthesized tones.
 *
 * Mobile autoplay handling:
 * - iOS/Android Safari/Chrome require AudioContext.resume() in a user gesture
 * - We "unlock" on the first touch/click anywhere in the page
 * - Once unlocked, sounds play freely
 */

let audioCtx = null;
let unlocked = false;

/**
 * Get or create AudioContext. Must be called from user gesture on first invocation.
 */
function getCtx() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/**
 * Unlock audio on first user interaction (mobile requirement).
 * Plays a silent buffer to satisfy iOS Safari's gesture requirement.
 */
function unlockAudio() {
  if (unlocked) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Resume if suspended (must be called inside gesture handler)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => { /* ignore */ });
  }

  // Play a silent buffer — required by iOS Safari to fully unlock
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch { /* ignore */ }

  unlocked = true;
}

/**
 * Auto-attach unlock listeners on import.
 * They self-remove after first interaction.
 */
function attachUnlockListeners() {
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
  const handler = () => {
    unlockAudio();
    events.forEach(evt => document.removeEventListener(evt, handler, true));
  };
  events.forEach(evt => document.addEventListener(evt, handler, { capture: true, passive: true }));
}

// Auto-init when module loads in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachUnlockListeners, { once: true });
  } else {
    attachUnlockListeners();
  }
}

/**
 * Play a "correct" chime — ascending two-note ding
 */
export function playCorrect() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    playTone(ctx, 523, now, 0.12, 0.3);          // C5
    playTone(ctx, 659, now + 0.1, 0.15, 0.3);    // E5
  } catch { /* silent fail */ }
}

/**
 * Play a "wrong" buzz — low descending tone
 */
export function playWrong() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch { /* silent fail */ }
}

/**
 * Play a "complete/celebration" jingle — 3 ascending notes
 */
export function playComplete() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    playTone(ctx, 523, now, 0.12, 0.25);           // C5
    playTone(ctx, 659, now + 0.12, 0.12, 0.25);    // E5
    playTone(ctx, 784, now + 0.24, 0.2, 0.3);      // G5
  } catch { /* silent fail */ }
}

function playTone(ctx, freq, startTime, duration, volume = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * Manual unlock helper — call from a click handler if auto-unlock didn't fire
 */
export function ensureAudioUnlocked() {
  unlockAudio();
}

/**
 * Status helper for debugging
 */
export function getAudioStatus() {
  return {
    supported: !!(window.AudioContext || window.webkitAudioContext),
    unlocked,
    state: audioCtx?.state || 'not-created',
  };
}
