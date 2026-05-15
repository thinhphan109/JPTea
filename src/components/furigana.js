/**
 * Furigana renderer — 漢字【かんじ】 → <ruby> HTML
 */

const FURIGANA_REGEX = /([一-龥々]+)【([ぁ-んァ-ヶー]+)】/g;

export function renderFurigana(text) {
  if (!text) return '';
  return text.replace(FURIGANA_REGEX, (_, kanji, reading) =>
    `<ruby>${kanji}<rt>${reading}</rt></ruby>`
  );
}

export function getPromptHtml(question) {
  if (question.promptHtml) return question.promptHtml;
  if (question.prompt) return renderFurigana(question.prompt);
  return '';
}

export function renderOptionText(text) {
  if (!text) return '';
  FURIGANA_REGEX.lastIndex = 0;
  return FURIGANA_REGEX.test(text) ? (FURIGANA_REGEX.lastIndex = 0, renderFurigana(text)) : text;
}
