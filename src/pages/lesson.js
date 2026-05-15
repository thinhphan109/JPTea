/**
 * Lesson detail page — 5 quiz cards
 */
import { initTheme } from '../lib/theme.js';
import { getProgress } from '../lib/storage.js';
import { loadLessonMeta } from '../lib/loader.js';
import { renderHeader, bindHeaderEvents } from '../components/header.js';
import { QUIZ_TYPES_META } from '../data/lessons.js';

initTheme();

async function render() {
  const params = new URLSearchParams(window.location.search);
  const lessonId = parseInt(params.get('id'), 10);
  if (!lessonId || lessonId < 1 || lessonId > 25) {
    window.location.href = '/';
    return;
  }

  const meta = await loadLessonMeta(lessonId);
  const lessonTitle = meta?.title || `Bài ${lessonId}`;

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderHeader({ backUrl: '/', backText: '← Danh sách bài' })}
    <main class="container">
      <section class="lesson-header">
        <div class="lesson-header__badge">📚 Bài ${lessonId}</div>
        <h1 class="lesson-header__title">${lessonTitle}</h1>
        <p class="lesson-header__subtitle">Chọn một quiz để bắt đầu ôn tập</p>
      </section>
      <div class="quiz-grid" id="quiz-grid"></div>
    </main>
  `;

  const grid = document.getElementById('quiz-grid');
  QUIZ_TYPES_META.forEach(quiz => {
    const progress = getProgress(lessonId, quiz.type);
    const bestText = progress
      ? `Cao nhất: ${progress.best}/${progress.total} (${Math.round(progress.best / progress.total * 100)}%)`
      : 'Chưa làm';

    const card = document.createElement('a');
    card.href = `/quiz.html?lesson=${lessonId}&type=${quiz.type}`;
    card.className = `quiz-card ${quiz.cssClass}`;
    card.innerHTML = `
      <div class="quiz-card__icon">${quiz.icon}</div>
      <div class="quiz-card__title">${quiz.title}</div>
      <div class="quiz-card__desc">${quiz.desc}</div>
      <div class="quiz-card__meta">
        <span>${quiz.questions} câu</span>
        <span>•</span>
        <span>${bestText}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  bindHeaderEvents();
}

render();
