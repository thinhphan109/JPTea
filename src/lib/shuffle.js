/**
 * Shuffle utilities with balanced answer distribution
 */

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function shuffleOptions(question) {
  const correctAnswer = question.options[question.correctIndex];
  const shuffled = shuffleArray(question.options);
  return { ...question, options: shuffled, correctIndex: shuffled.indexOf(correctAnswer) };
}

export function shuffleQuiz(questions) {
  let shuffled = shuffleArray(questions).map(q => shuffleOptions(q));
  return balanceAnswers(shuffled);
}

function balanceAnswers(questions) {
  const total = questions.length;
  if (total < 8) return questions;
  for (let attempt = 0; attempt < 10; attempt++) {
    const counts = [0, 0, 0, 0];
    questions.forEach(q => counts[q.correctIndex]++);
    if (counts.every(c => c >= total * 0.15 && c <= total * 0.35)) break;
    const over = counts.map((c, i) => ({ c, i })).filter(x => x.c > total * 0.35).map(x => x.i);
    if (!over.length) break;
    questions = questions.map(q => over.includes(q.correctIndex) ? shuffleOptions(q) : q);
  }
  return questions;
}
