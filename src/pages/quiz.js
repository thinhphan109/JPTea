/**
 * Quiz player — interactive quiz with TTS, session save, instant feedback
 */
import { initTheme } from '../lib/theme.js';
import { loadQuiz, QuizError } from '../lib/loader.js';
import { shuffleQuiz } from '../lib/shuffle.js';
import { saveProgress, saveSession, getSession, clearSession } from '../lib/storage.js';
import { getPromptHtml, renderOptionText } from '../components/furigana.js';
import { renderHeader, bindHeaderEvents } from '../components/header.js';
import { initTTS, speak, isTTSAvailable } from '../lib/tts.js';
import { isAIEnabledSync, getServerConfig, chatCompletion, PROMPTS } from '../lib/ai.js';
import { playCorrect, playWrong, playComplete } from '../lib/sounds.js';
import { t } from '../i18n/index.js';

// Sound preference
const SOUND_KEY = 'jptea-sound-enabled';
let soundEnabled = (() => {
  try { return localStorage.getItem(SOUND_KEY) !== 'false'; } catch { return true; }
})();
function setSoundEnabled(v) {
  soundEnabled = v;
  try { localStorage.setItem(SOUND_KEY, String(v)); } catch {}
}

// Listen for header sound toggle
window.addEventListener('soundtoggle', (e) => {
  soundEnabled = e.detail?.enabled ?? !soundEnabled;
});

const LABELS = ['A', 'B', 'C', 'D'];

let state = {
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  answers: [],
  lessonId: 0,
  quizType: '',
  quizTitle: '',
};

// Auto-save session on page unload
window.addEventListener('beforeunload', () => {
  if (state.questions.length > 0 && state.currentIndex < state.questions.length) {
    saveSession(state.lessonId, state.quizType, {
      currentIndex: state.currentIndex,
      score: state.score,
      answers: state.answers,
      questions: state.questions,
    });
  }
});

async function init() {
  initTheme();
  initTTS();
  // Load AI config in background (non-blocking)
  getServerConfig();

  const params = new URLSearchParams(window.location.search);
  state.lessonId = parseInt(params.get('lesson'), 10);
  state.quizType = params.get('type');

  if (!state.lessonId || !state.quizType) {
    window.location.href = '/';
    return;
  }

  // Check for saved session
  const session = getSession(state.lessonId, state.quizType);
  if (session && session.currentIndex > 0) {
    showResumePrompt(session);
    return;
  }

  await startFresh();
}

function showResumePrompt(session) {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderHeader({ backUrl: `/lesson.html?id=${state.lessonId}`, backText: '← Quay lại' })}
    <div class="quiz-player animate-fade">
      <div class="quiz-resume">
        <span class="quiz-resume__text">📌 Bạn đang làm dở (câu ${session.currentIndex + 1}/${session.questions.length}, đúng ${session.score} câu). Tiếp tục?</span>
        <div class="quiz-resume__actions">
          <button class="btn btn--primary btn--small" id="resume-btn">Tiếp tục</button>
          <button class="btn btn--secondary btn--small" id="restart-btn">Làm lại</button>
        </div>
      </div>
    </div>
  `;
  bindHeaderEvents();

  document.getElementById('resume-btn').addEventListener('click', () => {
    state.questions = session.questions;
    state.currentIndex = session.currentIndex;
    state.score = session.score;
    state.answers = session.answers;
    renderQuestion();
  });

  document.getElementById('restart-btn').addEventListener('click', async () => {
    clearSession(state.lessonId, state.quizType);
    await startFresh();
  });
}

async function startFresh() {
  try {
    const data = await loadQuiz(state.lessonId, state.quizType);
    state.questions = shuffleQuiz(data.questions);
    state.quizTitle = data.title || `Bài ${state.lessonId}`;
    state.currentIndex = 0;
    state.score = 0;
    state.answers = [];
    renderQuestion();
  } catch (err) {
    renderError(err);
  }
}

function renderQuestion() {
  const app = document.getElementById('app');
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  const progress = (state.currentIndex / total) * 100;
  const promptHtml = getPromptHtml(q);
  const hasPassage = q.passage || q.passageHtml;
  const passageHtml = q.passageHtml || (q.passage ? `<div class="quiz-question__passage">${q.passage}</div>` : '');

  // Extract text for TTS
  const ttsText = q.prompt || q.promptHtml?.replace(/<[^>]+>/g, '') || '';
  const showTTS = isTTSAvailable() && ttsText && /[\u3040-\u30ff\u4e00-\u9faf]/.test(ttsText);

  app.innerHTML = `
    ${renderHeader({ backUrl: `/lesson.html?id=${state.lessonId}`, backText: '← Quay lại' })}
    <div class="quiz-player animate-fade">
      <div class="quiz-progress">
        <div class="quiz-progress__bar">
          <div class="quiz-progress__fill" style="width: ${progress}%"></div>
        </div>
        <div class="quiz-progress__text">${state.currentIndex + 1} / ${total}</div>
      </div>

      <div class="quiz-question">
        ${hasPassage ? passageHtml : ''}
        <div class="quiz-question__prompt">
          ${promptHtml}
          ${showTTS ? `<button class="quiz-question__tts" id="tts-btn" aria-label="Nghe phát âm">🔊</button>` : ''}
        </div>
        ${q.subPrompt ? `<div class="quiz-question__sub-prompt">${q.subPrompt}</div>` : ''}
      </div>

      <div class="quiz-options" id="options"></div>
      <div id="hint-area"></div>
      <div id="explanation"></div>

      <div class="quiz-action-bar" id="action-bar">
        <div class="quiz-action-bar__left">
          ${isAIEnabledSync() ? `<button class="btn--ai" id="hint-btn" title="Nhận gợi ý từ AI">💡 Gợi ý</button>` : ''}
        </div>
        <div class="quiz-action-bar__right">
          <button class="btn btn--primary" id="next-question" style="display: none;">
            ${state.currentIndex < total - 1 ? 'Câu kế →' : 'Xem kết quả →'}
          </button>
        </div>
      </div>
    </div>
  `;

  bindHeaderEvents();
  renderOptions(q);

  // TTS button
  const ttsBtn = document.getElementById('tts-btn');
  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      ttsBtn.classList.add('quiz-question__tts--playing');
      speak(ttsText, {
        onEnd: () => ttsBtn.classList.remove('quiz-question__tts--playing'),
        onError: () => ttsBtn.classList.remove('quiz-question__tts--playing'),
      });
    });
  }

  // Next button
  document.getElementById('next-question')?.addEventListener('click', nextQuestion);

  // AI Hint button
  document.getElementById('hint-btn')?.addEventListener('click', () => requestHint(q));
}

async function requestHint(q) {
  const btn = document.getElementById('hint-btn');
  const area = document.getElementById('hint-area');
  if (!btn || !area) return;

  btn.disabled = true;
  btn.innerHTML = t('quiz.hintLoading');
  area.innerHTML = '<div class="hint-bubble hint-bubble--loading">' + t('common.loading') + '</div>';

  try {
    const promptText = (q.prompt || q.promptHtml?.replace(/<[^>]+>/g, '') || '').trim();
    const hint = await chatCompletion([
      { role: 'system', content: PROMPTS.systemTutor() },
      { role: 'user', content: PROMPTS.quizHint(promptText, q.options) },
    ], { maxTokens: 200, temperature: 0.7 });

    area.innerHTML = `<div class="hint-bubble">💡 <strong>${t('quiz.hintLabel').replace('💡 ', '')}</strong> ${escapeHtml(hint)}</div>`;
    btn.style.display = 'none';
  } catch (err) {
    area.innerHTML = `<div class="status-msg status-msg--error">❌ ${escapeHtml(err.message)}</div>`;
    btn.disabled = false;
    btn.innerHTML = t('quiz.hintRetry');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Pick the Japanese word/phrase to speak after a wrong answer.
 * Priority:
 *   1. q.prompt (if it's Japanese — kanji/hiragana/katakana)
 *   2. q.options[correctIndex] (if Japanese)
 *   3. q.promptHtml stripped of HTML
 */
function pickJapaneseToSpeak(q) {
  const isJapanese = (s) => typeof s === 'string' && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(s);

  // Strip 【】 furigana notation and HTML tags
  const clean = (s) => {
    if (!s) return '';
    return String(s)
      .replace(/<rt[^>]*>.*?<\/rt>/g, '')   // remove ruby readings
      .replace(/<[^>]+>/g, '')                // strip remaining HTML
      .replace(/【[^】]*】/g, '')             // remove 【kana】
      .replace(/\([^)]*\)/g, '')              // remove (...)
      .replace(/[「」『』]/g, '')              // remove quotes
      .trim();
  };

  // Try prompt
  const prompt = clean(q.prompt);
  if (isJapanese(prompt) && prompt.length <= 30) return prompt;

  // Try correct option
  if (typeof q.correctIndex === 'number' && Array.isArray(q.options)) {
    const correct = clean(q.options[q.correctIndex]);
    if (isJapanese(correct) && correct.length <= 30) return correct;
  }

  // Try promptHtml
  const promptHtml = clean(q.promptHtml);
  if (isJapanese(promptHtml) && promptHtml.length <= 50) return promptHtml;

  return null;
}

function renderOptions(q) {
  const container = document.getElementById('options');
  q.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = `
      <span class="quiz-option__label">${LABELS[index]}</span>
      <span class="quiz-option__text">${renderOptionText(option)}</span>
    `;
    btn.addEventListener('click', () => handleAnswer(index, q));
    container.appendChild(btn);
  });
}

function handleAnswer(selectedIndex, q) {
  if (state.answered) return;
  state.answered = true;

  const isCorrect = selectedIndex === q.correctIndex;
  if (isCorrect) state.score++;

  state.answers.push({
    questionId: q.id || state.currentIndex,
    selectedIndex,
    correctIndex: q.correctIndex,
    isCorrect,
    prompt: q.prompt || '',
    correctAnswer: q.options[q.correctIndex],
  });

  // Highlight
  const options = document.querySelectorAll('.quiz-option');
  options.forEach((opt, i) => {
    opt.classList.add('quiz-option--disabled');
    if (i === q.correctIndex) opt.classList.add('quiz-option--correct');
    if (i === selectedIndex && !isCorrect) opt.classList.add('quiz-option--wrong');
  });

  // Explanation
  if (q.explanation) {
    document.getElementById('explanation').innerHTML = `
      <div class="quiz-explanation">${isCorrect ? '✅' : '❌'} ${q.explanation}</div>
    `;
  }

  // Sound + TTS feedback
  if (isCorrect) {
    if (soundEnabled) playCorrect();
  } else {
    if (soundEnabled) playWrong();
    // Auto-TTS reinforcement on WRONG answer — speak the Japanese word
    const jpText = pickJapaneseToSpeak(q);
    if (jpText) {
      // Small delay so wrong-buzz finishes first
      setTimeout(() => {
        speak(jpText, {
          rate: 0.85,
          onError: () => { /* silent fail */ },
        });
      }, 400);
    }
  }

  document.getElementById('next-question').style.display = 'inline-flex';

  // Auto-save session
  saveSession(state.lessonId, state.quizType, {
    currentIndex: state.currentIndex + 1,
    score: state.score,
    answers: state.answers,
    questions: state.questions,
  });
}

function nextQuestion() {
  state.currentIndex++;
  state.answered = false;

  if (state.currentIndex >= state.questions.length) {
    clearSession(state.lessonId, state.quizType);
    renderResult();
  } else {
    renderQuestion();
  }
}

function renderResult() {
  const total = state.questions.length;
  const pct = Math.round((state.score / total) * 100);

  // Celebration sound for good scores
  if (soundEnabled && pct >= 60) {
    setTimeout(() => playComplete(), 200);
  }
  const scoreClass = pct >= 80 ? 'result__score--high' : pct >= 50 ? 'result__score--mid' : 'result__score--low';
  const emoji = pct >= 90 ? '🌟' : pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';

  saveProgress(state.lessonId, state.quizType, state.score, total);

  const wrongAnswers = state.answers.filter(a => !a.isCorrect);
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderHeader({ backUrl: `/lesson.html?id=${state.lessonId}`, backText: '← Quay lại' })}
    <div class="container container--narrow">
      <div class="result animate-fade">
        <div class="result__emoji">${emoji}</div>
        <div class="result__score ${scoreClass}">${state.score} / ${total}</div>
        <div class="result__label">${pct}% — ${getGrade(pct)}</div>
        <div class="result__actions">
          <button class="btn btn--primary" onclick="location.reload()">Làm lại 🔄</button>
          <a href="/lesson.html?id=${state.lessonId}" class="btn btn--secondary">Chọn quiz khác</a>
        </div>
      </div>
      ${wrongAnswers.length > 0 ? renderReview(wrongAnswers) : '<p style="text-align:center; color: var(--color-correct); margin-top: var(--space-8);">🎉 Hoàn hảo!</p>'}
    </div>
  `;
  bindHeaderEvents();
}

function renderReview(wrong) {
  return `
    <div class="review-list">
      <h3 style="color: var(--color-wrong);">📋 Câu sai (${wrong.length})</h3>
      ${wrong.map(a => `
        <div class="review-item">
          <div class="review-item__question">${a.prompt || `Câu ${a.questionId}`}</div>
          <div class="review-item__answer">
            Bạn chọn: <strong>${LABELS[a.selectedIndex]}</strong> —
            Đáp án: <span class="review-item__correct">${LABELS[a.correctIndex]}. ${a.correctAnswer}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getGrade(pct) {
  if (pct >= 90) return 'Xuất sắc!';
  if (pct >= 80) return 'Giỏi lắm!';
  if (pct >= 60) return 'Khá tốt';
  if (pct >= 40) return 'Cần ôn thêm';
  return 'Cố gắng lên!';
}

function renderError(err) {
  const app = document.getElementById('app');
  const isQuizError = err instanceof QuizError;
  const code = isQuizError ? err.code : 'UNKNOWN';
  const msg = isQuizError ? err.message : (err?.message || String(err));

  // Code-specific UI
  let icon = '⚠️';
  let title = 'Lỗi';
  let suggestion = '';
  let primaryAction = `<a href="/lesson.html?id=${state.lessonId}" class="btn btn--primary">← Quay lại chọn quiz khác</a>`;

  if (code === 'NOT_FOUND') {
    icon = '📝';
    title = 'Quiz này chưa có';
    suggestion = '<p style="color: var(--color-text-muted); margin-top: var(--space-3); font-size: var(--text-sm);">Quiz cho bài này đang được cập nhật. Vui lòng quay lại sau hoặc chọn bài khác.</p>';
  } else if (code === 'INVALID_LESSON' || code === 'INVALID_TYPE') {
    icon = '🚫';
    title = 'URL không hợp lệ';
    primaryAction = `<a href="/" class="btn btn--primary">← Về trang chủ</a>`;
  } else if (code === 'NETWORK') {
    icon = '📡';
    title = 'Lỗi kết nối';
    suggestion = '<p style="color: var(--color-text-muted); margin-top: var(--space-3); font-size: var(--text-sm);">Kiểm tra kết nối internet hoặc thử lại.</p>';
    primaryAction = `<button class="btn btn--primary" onclick="location.reload()">🔄 Thử lại</button>` + primaryAction;
  } else if (code === 'INVALID_DATA') {
    icon = '📦';
    title = 'Dữ liệu quiz lỗi';
    suggestion = '<p style="color: var(--color-text-muted); margin-top: var(--space-3); font-size: var(--text-sm);">File dữ liệu bị hỏng. Vui lòng báo lại để fix.</p>';
  }

  app.innerHTML = `
    ${renderHeader({ backUrl: `/lesson.html?id=${state.lessonId}`, backText: '← Quay lại' })}
    <div class="container container--narrow" style="padding: var(--space-16) var(--space-6); text-align: center;">
      <div style="font-size: 4rem; margin-bottom: var(--space-4);">${icon}</div>
      <h2 style="margin-bottom: var(--space-3);">${title}</h2>
      <p style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto;">${escapeHtml(msg)}</p>
      ${suggestion}
      <div style="margin-top: var(--space-8); display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap;">
        ${primaryAction}
      </div>
    </div>
  `;
  bindHeaderEvents();
}

init();
