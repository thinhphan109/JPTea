/**
 * Sound effects — Web Audio API synthesized tones.
 * No external files needed. Lightweight and instant.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/**
 * Play a "correct" chime — ascending two-note ding
 */
export function playCorrect() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Note 1: C5 (523 Hz)
    playTone(ctx, 523, now, 0.12, 0.3);
    // Note 2: E5 (659 Hz) — slightly delayed
    playTone(ctx, 659, now + 0.1, 0.15, 0.3);
  } catch { /* silent fail */ }
}

/**
 * Play a "wrong" buzz — low descending tone
 */
export function playWrong() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Single low tone with slight pitch drop
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
    const now = ctx.currentTime;

    playTone(ctx, 523, now, 0.12, 0.25);       // C5
    playTone(ctx, 659, now + 0.12, 0.12, 0.25); // E5
    playTone(ctx, 784, now + 0.24, 0.2, 0.3);   // G5
  } catch { /* silent fail */ }
}

/**
 * Simple tone helper
 */
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
