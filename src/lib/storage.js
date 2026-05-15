/**
 * LocalStorage wrapper — progress tracking + session save/resume
 */

const PREFIX = 'jptea';

// ===== PROGRESS (best scores) =====

export function getProgress(lessonId, quizType) {
  const key = `${PREFIX}-${lessonId}-${quizType}`;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export function saveProgress(lessonId, quizType, score, total) {
  const key = `${PREFIX}-${lessonId}-${quizType}`;
  const existing = getProgress(lessonId, quizType);
  const data = {
    best: existing ? Math.max(existing.best, score) : score,
    total,
    attempts: existing ? existing.attempts + 1 : 1,
    lastDate: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(data));
}

export function getLessonProgress(lessonId) {
  const types = ['vocab-basic', 'vocab-practice', 'reading', 'grammar', 'kanji'];
  let completed = 0;
  for (const type of types) {
    const p = getProgress(lessonId, type);
    if (p && p.best > 0) completed++;
  }
  return { completed, total: types.length, percentage: Math.round((completed / types.length) * 100) };
}

// ===== SESSION (resume mid-quiz) =====

export function saveSession(lessonId, quizType, sessionData) {
  const key = `${PREFIX}-session-${lessonId}-${quizType}`;
  localStorage.setItem(key, JSON.stringify({
    ...sessionData,
    savedAt: new Date().toISOString(),
  }));
}

export function getSession(lessonId, quizType) {
  const key = `${PREFIX}-session-${lessonId}-${quizType}`;
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (!data) return null;
    // Expire sessions older than 24h
    const age = Date.now() - new Date(data.savedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      clearSession(lessonId, quizType);
      return null;
    }
    return data;
  } catch { return null; }
}

export function clearSession(lessonId, quizType) {
  const key = `${PREFIX}-session-${lessonId}-${quizType}`;
  localStorage.removeItem(key);
}
