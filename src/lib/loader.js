/**
 * Quiz JSON loader with validation + friendly error types
 */

const QUIZ_TYPES = ['vocab-basic', 'vocab-practice', 'reading', 'grammar', 'kanji'];

/**
 * Custom error class so UI can distinguish error types
 */
export class QuizError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'QuizError';
    this.code = code; // 'NOT_FOUND' | 'INVALID_TYPE' | 'INVALID_DATA' | 'NETWORK'
    this.details = details;
  }
}

export async function loadQuiz(lessonId, quizType) {
  if (!Number.isInteger(lessonId) || lessonId < 1 || lessonId > 25) {
    throw new QuizError(
      `Bài học không hợp lệ: ${lessonId}. Vui lòng chọn bài 1–25.`,
      'INVALID_LESSON',
      { lessonId }
    );
  }

  if (!QUIZ_TYPES.includes(quizType)) {
    throw new QuizError(
      `Loại quiz không hợp lệ: ${quizType}.`,
      'INVALID_TYPE',
      { quizType, validTypes: QUIZ_TYPES }
    );
  }

  const padded = String(lessonId).padStart(2, '0');
  const typeIndex = QUIZ_TYPES.indexOf(quizType) + 1;
  const fileName = `${String(typeIndex).padStart(2, '0')}-${quizType}.json`;
  const url = `/data/bai-${padded}/${fileName}`;

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new QuizError(
      `Không thể kết nối server: ${err.message}`,
      'NETWORK',
      { url, originalError: err.message }
    );
  }

  if (res.status === 404) {
    throw new QuizError(
      `Bài ${lessonId} chưa có quiz "${getQuizTypeName(quizType)}". Vui lòng chọn bài khác.`,
      'NOT_FOUND',
      { lessonId, quizType, url }
    );
  }

  if (!res.ok) {
    throw new QuizError(
      `Lỗi tải dữ liệu: HTTP ${res.status}`,
      'NETWORK',
      { status: res.status, url }
    );
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new QuizError(
      'File quiz bị lỗi định dạng JSON.',
      'INVALID_DATA',
      { url, parseError: err.message }
    );
  }

  try {
    validateQuiz(data);
  } catch (err) {
    throw new QuizError(
      `Dữ liệu quiz không hợp lệ: ${err.message}`,
      'INVALID_DATA',
      { url, validationError: err.message }
    );
  }

  return data;
}

export async function loadLessonMeta(lessonId) {
  const padded = String(lessonId).padStart(2, '0');
  try {
    const res = await fetch(`/data/bai-${padded}/meta.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Check which quiz types are available for a lesson
 */
export async function getAvailableQuizTypes(lessonId) {
  const padded = String(lessonId).padStart(2, '0');
  const checks = QUIZ_TYPES.map(async (type, idx) => {
    const fileName = `${String(idx + 1).padStart(2, '0')}-${type}.json`;
    try {
      const res = await fetch(`/data/bai-${padded}/${fileName}`, { method: 'HEAD' });
      return res.ok ? type : null;
    } catch {
      return null;
    }
  });
  return (await Promise.all(checks)).filter(Boolean);
}

/**
 * Check if a lesson has any data at all
 */
export async function lessonHasData(lessonId) {
  const meta = await loadLessonMeta(lessonId);
  return meta !== null;
}

function getQuizTypeName(quizType) {
  const names = {
    'vocab-basic': 'Từ vựng cơ bản',
    'vocab-practice': 'Từ vựng luyện tập',
    'reading': 'Đọc hiểu',
    'grammar': 'Ngữ pháp',
    'kanji': 'Kanji',
  };
  return names[quizType] || quizType;
}

function validateQuiz(data) {
  if (!data.questions?.length) throw new Error('Quiz không có câu hỏi nào');
  data.questions.forEach((q, i) => {
    if (!q.options || q.options.length !== 4) throw new Error(`Câu ${i + 1}: cần đúng 4 đáp án`);
    if (q.correctIndex < 0 || q.correctIndex > 3) throw new Error(`Câu ${i + 1}: correctIndex không hợp lệ`);
    if (!q.prompt && !q.promptHtml) throw new Error(`Câu ${i + 1}: thiếu prompt`);
  });
}

export { QUIZ_TYPES, getQuizTypeName };
