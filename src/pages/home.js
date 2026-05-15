/**
 * Home page — Lesson grid (Bài 1-25)
 */
import { initTheme } from '../lib/theme.js';
import { getLessonProgress } from '../lib/storage.js';
import { renderHeader, bindHeaderEvents } from '../components/header.js';
import { mountSakura } from '../components/sakura.js';
import { LESSONS } from '../data/lessons.js';

initTheme();
mountSakura();

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderHeader({ backUrl: null, backText: '', showThemeToggle: true }).replace('<a href="" class="btn btn--back"></a>', '<span></span>')}
    <main class="container">
      <section class="hero">
        <h1 class="hero__title">🌸 Học Tiếng Nhật N5</h1>
        <p class="hero__subtitle">Theo giáo trình Minna no Nihongo Sơ cấp I</p>
      </section>
      <div class="lesson-grid" id="lesson-grid"></div>
    </main>
  `;

  const grid = document.getElementById('lesson-grid');
  LESSONS.forEach(lesson => {
    const progress = getLessonProgress(lesson.id);
    const card = document.createElement('a');
    card.href = `/lesson.html?id=${lesson.id}`;
    card.className = 'lesson-card';
    card.innerHTML = `
      <div class="lesson-card__number">${lesson.id}</div>
      <div class="lesson-card__title">${lesson.title}</div>
      <div class="lesson-card__title-vi">${lesson.titleVi}</div>
      <div class="lesson-card__progress">
        <div class="lesson-card__progress-bar" style="width: ${progress.percentage}%"></div>
      </div>
    `;
    grid.appendChild(card);
  });

  bindHeaderEvents();
}

render();
