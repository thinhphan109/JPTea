/**
 * Quiz Generator — converts vocab source files to 5 quiz JSON files
 *
 * Usage: node scripts/generate-quiz.js [lesson_id]
 *   - With ID: generate one lesson
 *   - Without: generate all lessons that have source files
 *
 * Reads:  scripts/sources/bai-XX.json (truth data)
 * Writes: public/data/bai-XX/01-vocab-basic.json ... 05-kanji.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCES_DIR = path.join(__dirname, 'sources');
const OUTPUT_DIR = path.join(ROOT, 'public', 'data');

// ===== Helpers =====

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n, exclude = []) {
  const filtered = arr.filter(x => !exclude.includes(x));
  return shuffle(filtered).slice(0, n);
}

/** Build prompt with furigana for kanji */
function withFurigana(item) {
  if (item.kanji === item.kana) return item.kanji;
  // Detect kanji → use 【】 notation that furigana.js parses
  if (/[一-龥]/.test(item.kanji)) {
    return item.kanji.replace(/([一-龥]+)/g, (m) => {
      // Match the kana that aligns with the kanji portion
      // For simplicity, use the full kana as reading hint
      return `${m}【${item.kana}】`;
    });
  }
  return item.kanji;
}

// ===== Quiz Generators =====

function genVocabBasic(vocab, lessonId, title) {
  // Min 50 questions: shows kanji+furigana, asks for Vietnamese
  const targetCount = Math.max(50, vocab.length);
  const questions = [];

  for (let i = 0; i < targetCount; i++) {
    const correct = vocab[i % vocab.length];
    const distractors = pick(vocab.map(v => v.vi), 3, [correct.vi]);
    const options = shuffle([correct.vi, ...distractors]);

    questions.push({
      id: i + 1,
      promptHtml: hasKanji(correct) ? toFuriganaHtml(correct) : correct.kana,
      prompt: correct.kana,
      subPrompt: 'Nghĩa tiếng Việt là?',
      options,
      correctIndex: options.indexOf(correct.vi),
      explanation: `${correct.kanji}【${correct.kana}】= ${correct.vi}`,
    });
  }

  return {
    title: `Từ vựng cơ bản — Bài ${lessonId}: ${title}`,
    type: 'vocab-basic',
    questions,
  };
}

function genVocabPractice(vocab, lessonId, title) {
  // 65 questions: no furigana, mixed direction (JP→VI and VI→JP)
  const targetCount = Math.max(65, vocab.length * 2);
  const questions = [];

  for (let i = 0; i < targetCount; i++) {
    const correct = vocab[i % vocab.length];
    const direction = i % 2 === 0 ? 'jp2vi' : 'vi2jp';

    if (direction === 'jp2vi') {
      const distractors = pick(vocab.map(v => v.vi), 3, [correct.vi]);
      const options = shuffle([correct.vi, ...distractors]);
      questions.push({
        id: i + 1,
        prompt: correct.kanji,
        subPrompt: 'Nghĩa là?',
        options,
        correctIndex: options.indexOf(correct.vi),
        explanation: `${correct.kanji}【${correct.kana}】= ${correct.vi}`,
      });
    } else {
      const distractors = pick(vocab.map(v => v.kanji), 3, [correct.kanji]);
      const options = shuffle([correct.kanji, ...distractors]);
      questions.push({
        id: i + 1,
        prompt: correct.vi,
        subPrompt: 'Tiếng Nhật là?',
        options,
        correctIndex: options.indexOf(correct.kanji),
        explanation: `${correct.vi} = ${correct.kanji}【${correct.kana}】`,
      });
    }
  }

  return {
    title: `Từ vựng luyện tập — Bài ${lessonId}: ${title}`,
    type: 'vocab-practice',
    questions,
  };
}

function genReading(vocab, grammar, lessonId, title) {
  // 3 passages × 7 questions = 21 questions
  // Use vocab + grammar to build short paragraphs
  const passages = buildPassages(vocab, grammar, title);
  const questions = [];
  let id = 1;

  passages.forEach((p, pIdx) => {
    p.questions.forEach(q => {
      const distractors = pick(vocab.map(v => v.vi), 3, [q.correctText]);
      const options = shuffle([q.correctText, ...distractors]);
      questions.push({
        id: id++,
        passageHtml: pIdx === 0 || questions.length % 7 === 0
          ? `<div class="quiz-question__passage">${p.passageHtml}</div>`
          : '',
        prompt: q.prompt,
        options,
        correctIndex: options.indexOf(q.correctText),
        explanation: q.explanation || '',
      });
    });
  });

  return {
    title: `Đọc hiểu — Bài ${lessonId}: ${title}`,
    type: 'reading',
    questions,
  };
}

function genGrammar(grammar, vocab, lessonId, title) {
  // 50 questions about grammar points & particles
  const questions = [];
  let id = 1;

  // Generate from each grammar point
  grammar.forEach(g => {
    g.examples.forEach(ex => {
      const distractors = pick(grammar.map(gg => gg.title), 3, [g.title]);
      const options = shuffle([g.title, ...distractors]);
      questions.push({
        id: id++,
        prompt: ex.jp,
        subPrompt: 'Cấu trúc nào?',
        options,
        correctIndex: options.indexOf(g.title),
        explanation: `${g.viExplain}. Ví dụ: ${ex.jp} = ${ex.vi}`,
      });
    });
  });

  // Particle quizzes (は/が/も/の/か)
  const particles = ['は', 'が', 'も', 'の', 'か'];
  const particleQs = [
    { sentence: '私___学生です', answer: 'は', why: 'は đánh dấu chủ đề' },
    { sentence: '私___名前は田中です', answer: 'の', why: 'の chỉ sở hữu' },
    { sentence: '私___学生です', answer: 'も', why: 'も = "cũng" (chỉ sự tương đồng)' },
    { sentence: 'あなたは学生です___', answer: 'か', why: 'か là trợ từ nghi vấn' },
  ];

  // Repeat particle questions to reach 50
  while (questions.length < 50) {
    const pq = particleQs[questions.length % particleQs.length];
    const options = shuffle([...particles]);
    questions.push({
      id: id++,
      prompt: pq.sentence,
      subPrompt: 'Trợ từ thích hợp?',
      options,
      correctIndex: options.indexOf(pq.answer),
      explanation: pq.why,
    });
  }

  return {
    title: `Ngữ pháp & Trợ từ — Bài ${lessonId}: ${title}`,
    type: 'grammar',
    questions: questions.slice(0, 50),
  };
}

function genKanji(vocab, lessonId, title) {
  // 60 questions: read kanji → choose hiragana or Vietnamese
  const kanjiOnly = vocab.filter(v => hasKanji(v) && v.kanji !== v.kana);
  if (kanjiOnly.length === 0) {
    return { title: `Kanji — Bài ${lessonId}`, type: 'kanji', questions: [] };
  }

  const questions = [];
  const target = Math.max(60, kanjiOnly.length * 2);

  for (let i = 0; i < target; i++) {
    const correct = kanjiOnly[i % kanjiOnly.length];
    const askKana = i % 2 === 0;

    if (askKana) {
      const distractors = pick(kanjiOnly.map(v => v.kana), 3, [correct.kana]);
      const options = shuffle([correct.kana, ...distractors]);
      questions.push({
        id: i + 1,
        prompt: correct.kanji,
        subPrompt: 'Cách đọc (hiragana)?',
        options,
        correctIndex: options.indexOf(correct.kana),
        explanation: `${correct.kanji} đọc là ${correct.kana} = ${correct.vi}`,
      });
    } else {
      const distractors = pick(kanjiOnly.map(v => v.vi), 3, [correct.vi]);
      const options = shuffle([correct.vi, ...distractors]);
      questions.push({
        id: i + 1,
        prompt: correct.kanji,
        subPrompt: 'Nghĩa tiếng Việt?',
        options,
        correctIndex: options.indexOf(correct.vi),
        explanation: `${correct.kanji}【${correct.kana}】= ${correct.vi}`,
      });
    }
  }

  return {
    title: `Ôn tập Kanji — Bài ${lessonId}: ${title}`,
    type: 'kanji',
    questions,
  };
}

// ===== Helpers =====

function hasKanji(item) {
  return /[一-龥]/.test(item.kanji);
}

function toFuriganaHtml(item) {
  // Wrap kanji portions with ruby
  if (!hasKanji(item)) return item.kanji;
  return `<ruby>${item.kanji}<rt>${item.kana}</rt></ruby>`;
}

function buildPassages(vocab, grammar, title) {
  // Build 3 simple passages using lesson vocab/grammar
  const findVocab = (kana) => vocab.find(v => v.kana === kana || v.kanji === kana);

  return [
    {
      passageHtml: `<ruby>私<rt>わたし</rt></ruby>はマイクです。アメリカから<ruby>来<rt>き</rt></ruby>ました。<ruby>会社員<rt>かいしゃいん</rt></ruby>です。<ruby>初<rt>はじ</rt></ruby>めまして。どうぞよろしくお<ruby>願<rt>ねが</rt></ruby>いします。`,
      questions: [
        { prompt: 'マイクさんは何人ですか?', correctText: 'Mỹ', explanation: 'アメリカから来ました = đến từ Mỹ' },
        { prompt: 'マイクさんの仕事は?', correctText: 'Nhân viên công ty', explanation: '会社員 = nhân viên công ty' },
        { prompt: 'マイクさんの初対面の挨拶は?', correctText: 'Rất hân hạnh được gặp', explanation: '初めまして = rất hân hạnh được gặp' },
        { prompt: 'マイクさんは学生ですか?', correctText: 'Không', explanation: 'Không phải. Anh ấy là 会社員' },
        { prompt: 'マイクさんの国籍は?', correctText: 'Mỹ', explanation: 'アメリカ人 = người Mỹ' },
        { prompt: 'マイクさんは医者ですか?', correctText: 'Không', explanation: '医者 không xuất hiện' },
        { prompt: 'マイクさんは何と挨拶しましたか?', correctText: 'Rất mong được giúp đỡ', explanation: 'よろしくお願いします' },
      ],
    },
    {
      passageHtml: `<ruby>田中<rt>たなか</rt></ruby>さんは<ruby>日本人<rt>にほんじん</rt></ruby>です。<ruby>先生<rt>せんせい</rt></ruby>です。<ruby>大学<rt>だいがく</rt></ruby>で<ruby>働<rt>はたら</rt></ruby>いています。25<ruby>歳<rt>さい</rt></ruby>です。`,
      questions: [
        { prompt: '田中さんの国は?', correctText: 'Nhật Bản', explanation: '日本人 = người Nhật' },
        { prompt: '田中さんの仕事は?', correctText: 'Thầy/Cô giáo', explanation: '先生 = giáo viên' },
        { prompt: '田中さんはどこで働きますか?', correctText: 'Đại học', explanation: '大学 = đại học' },
        { prompt: '田中さんは何歳ですか?', correctText: '25 tuổi', explanation: '25歳 = 25 tuổi' },
        { prompt: '田中さんは医者ですか?', correctText: 'Không', explanation: 'Là 先生, không phải 医者' },
        { prompt: '田中さんは学生ですか?', correctText: 'Không', explanation: 'Là 先生 (giáo viên)' },
        { prompt: '田中さんはアメリカ人ですか?', correctText: 'Không', explanation: '日本人 = người Nhật' },
      ],
    },
    {
      passageHtml: `リンさんはベトナム<ruby>人<rt>じん</rt></ruby>です。<ruby>学生<rt>がくせい</rt></ruby>です。<ruby>東京<rt>とうきょう</rt></ruby>大学の学生です。20歳です。`,
      questions: [
        { prompt: 'リンさんの国は?', correctText: 'Việt Nam', explanation: 'ベトナム人 = người Việt' },
        { prompt: 'リンさんの仕事は?', correctText: 'Học sinh, sinh viên', explanation: '学生 = sinh viên' },
        { prompt: 'リンさんはどこの大学?', correctText: 'Đại học (Tokyo)', explanation: '東京大学 = ĐH Tokyo' },
        { prompt: 'リンさんは何歳?', correctText: '20 tuổi', explanation: '20歳 = 20 tuổi' },
        { prompt: 'リンさんは先生ですか?', correctText: 'Không', explanation: 'Là 学生 (sinh viên)' },
        { prompt: 'リンさんは中国人ですか?', correctText: 'Không', explanation: 'Là ベトナム人' },
        { prompt: 'リンさんは会社員ですか?', correctText: 'Không', explanation: 'Là 学生' },
      ],
    },
  ];
}

// ===== Main =====

function generateLesson(lessonId) {
  const padded = String(lessonId).padStart(2, '0');
  const sourceFile = path.join(SOURCES_DIR, `bai-${padded}.json`);

  if (!fs.existsSync(sourceFile)) {
    console.log(`⚠️  Source not found: ${sourceFile}`);
    return false;
  }

  const source = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  const { vocab, grammar = [], title } = source;

  const outDir = path.join(OUTPUT_DIR, `bai-${padded}`);
  fs.mkdirSync(outDir, { recursive: true });

  // Meta file
  fs.writeFileSync(
    path.join(outDir, 'meta.json'),
    JSON.stringify({ id: lessonId, title, vocabCount: vocab.length }, null, 2)
  );

  // Generate 5 quiz files
  const files = [
    { name: '01-vocab-basic.json', data: genVocabBasic(vocab, lessonId, title) },
    { name: '02-vocab-practice.json', data: genVocabPractice(vocab, lessonId, title) },
    { name: '03-reading.json', data: genReading(vocab, grammar, lessonId, title) },
    { name: '04-grammar.json', data: genGrammar(grammar, vocab, lessonId, title) },
    { name: '05-kanji.json', data: genKanji(vocab, lessonId, title) },
  ];

  files.forEach(f => {
    fs.writeFileSync(path.join(outDir, f.name), JSON.stringify(f.data, null, 2));
    console.log(`  ✓ ${f.name} — ${f.data.questions.length} questions`);
  });

  return true;
}

// CLI
const arg = process.argv[2];
if (arg) {
  const id = parseInt(arg, 10);
  console.log(`\n📚 Generating Bài ${id}...`);
  generateLesson(id);
} else {
  console.log(`\n📚 Generating all lessons with source files...\n`);
  let count = 0;
  for (let i = 1; i <= 25; i++) {
    if (generateLesson(i)) count++;
  }
  console.log(`\n✅ Done. Generated ${count} lessons.`);
}
