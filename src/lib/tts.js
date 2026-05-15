/**
 * Text-to-Speech module — uses Web Speech API with Japanese voice
 */

let japaneseVoice = null;
let isReady = false;

/**
 * Initialize TTS — find Japanese voice
 */
export function initTTS() {
  if (!('speechSynthesis' in window)) return;

  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    japaneseVoice = voices.find(v => v.lang.startsWith('ja')) || null;
    isReady = true;
  };

  // Voices may load async
  if (speechSynthesis.getVoices().length > 0) {
    loadVoices();
  } else {
    speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
  }
}

/**
 * Speak Japanese text
 * @param {string} text - Text to speak (hiragana/katakana/kanji)
 * @param {object} options - { rate, pitch, onEnd }
 */
export function speak(text, options = {}) {
  if (!('speechSynthesis' in window)) return;
  if (!text) return;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  // Strip HTML tags and furigana notation
  const cleanText = text
    .replace(/<[^>]+>/g, '')
    .replace(/【[^】]+】/g, '')
    .replace(/\([^)]+\)/g, '')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = options.rate || 0.85;
  utterance.pitch = options.pitch || 1;

  if (japaneseVoice) {
    utterance.voice = japaneseVoice;
  }

  if (options.onEnd) {
    utterance.addEventListener('end', options.onEnd);
  }
  if (options.onError) {
    utterance.addEventListener('error', options.onError);
  }

  speechSynthesis.speak(utterance);
}

/**
 * Stop speaking
 */
export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

/**
 * Check if TTS is available
 */
export function isTTSAvailable() {
  return 'speechSynthesis' in window;
}
