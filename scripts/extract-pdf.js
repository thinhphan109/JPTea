/**
 * PDF Vocab Extractor — reads "Bản dịch và giải thích ngữ pháp" PDF
 * and extracts vocabulary per lesson.
 *
 * Usage: node scripts/extract-pdf.js
 * Output: scripts/sources/bai-XX.json (raw extracted, needs review)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BOOK_DIR = path.join(ROOT, 'book', 'N5');
const SOURCES_DIR = path.join(__dirname, 'sources');

// Find the grammar translation PDF — index 3 in sorted directory listing
function findPdf(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).sort();
  // The grammar translation book contains "pháp" in its name
  // Try matching, fallback to index
  for (const f of files) {
    if (f.length === 53 && f.startsWith('B')) return path.join(dir, f);
  }
  // Fallback: pick the 4th PDF (0-indexed: 3)
  if (files.length >= 4) return path.join(dir, files[3]);
  throw new Error('Could not find grammar translation PDF. Files: ' + files.join(', '));
}

const PDF_FILE = findPdf(BOOK_DIR);

async function main() {
  console.log('📖 Reading PDF...');
  const buffer = fs.readFileSync(PDF_FILE);
  const data = await pdf(buffer);

  console.log(`  Pages: ${data.numpages}`);
  console.log(`  Text length: ${data.text.length} chars`);

  // Save raw text for inspection
  const rawPath = path.join(SOURCES_DIR, '_raw-text.txt');
  fs.mkdirSync(SOURCES_DIR, { recursive: true });
  fs.writeFileSync(rawPath, data.text);
  console.log(`  ✓ Raw text saved to: ${rawPath}`);

  // Try to split by lesson markers
  const lessons = splitByLesson(data.text);
  console.log(`\n📚 Found ${lessons.length} lesson sections\n`);

  for (const lesson of lessons) {
    console.log(`  Bài ${lesson.id}: ${lesson.lines.length} lines`);
    const vocab = extractVocab(lesson.lines);
    if (vocab.length > 0) {
      const padded = String(lesson.id).padStart(2, '0');
      const outFile = path.join(SOURCES_DIR, `bai-${padded}-extracted.json`);
      const source = {
        lesson: lesson.id,
        title: lesson.title || `Bài ${lesson.id}`,
        titleVi: '',
        source: 'Extracted from Minna no Nihongo Bản dịch - Tập 1',
        vocab,
        grammar: [],
      };
      fs.writeFileSync(outFile, JSON.stringify(source, null, 2));
      console.log(`    → ${vocab.length} vocab items → ${outFile}`);
    }
  }

  console.log('\n✅ Done. Review *-extracted.json files and rename to bai-XX.json when verified.');
}

function splitByLesson(text) {
  const lessons = [];
  const lines = text.split('\n');

  // Common patterns for lesson headers in Vietnamese translation books:
  // "Bài 1", "BÀI 1", "第1課", "Bài 1:", etc.
  const lessonRegex = /(?:^|\n)\s*(?:Bài|BÀI|第)\s*(\d+)\s*(?:課|:|\s|$)/i;
  const altRegex = /(?:^|\n)\s*(?:Bài|BÀI)\s+(\d+)/i;

  let currentLesson = null;
  let currentLines = [];

  for (const line of lines) {
    const match = line.match(lessonRegex) || line.match(altRegex);
    if (match) {
      if (currentLesson !== null) {
        lessons.push({ id: currentLesson, title: '', lines: currentLines });
      }
      currentLesson = parseInt(match[1], 10);
      currentLines = [line];
    } else if (currentLesson !== null) {
      currentLines.push(line);
    }
  }

  if (currentLesson !== null) {
    lessons.push({ id: currentLesson, title: '', lines: currentLines });
  }

  return lessons;
}

function extractVocab(lines) {
  const vocab = [];
  // Common patterns in Vietnamese translation books:
  // "漢字 [かな] nghĩa tiếng Việt"
  // "かな nghĩa tiếng Việt"
  // "word    meaning"

  // Pattern: Japanese text followed by Vietnamese meaning
  // Japanese chars: Hiragana (\u3040-\u309F), Katakana (\u30A0-\u30FF), Kanji (\u4E00-\u9FFF)
  const jpRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;
  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // Skip headers, page numbers, etc.
    if (/^\d+$/.test(trimmed)) continue;
    if (/^(Bài|BÀI|第|Từ vựng|Ngữ pháp|Mẫu câu|Hội thoại)/i.test(trimmed)) continue;

    // Check if line has both Japanese and Vietnamese
    if (jpRegex.test(trimmed) && viRegex.test(trimmed)) {
      const parsed = parseLine(trimmed);
      if (parsed) vocab.push(parsed);
    }
  }

  return vocab;
}

function parseLine(line) {
  // Try various patterns:

  // Pattern 1: "kanji【kana】 Vietnamese meaning"
  const p1 = line.match(/^([^\s【]+)【([^\】]+)】\s+(.+)/);
  if (p1) return { kanji: p1[1], kana: p1[2], vi: p1[3].trim(), en: '', pos: '' };

  // Pattern 2: "kanji（kana） Vietnamese"
  const p2 = line.match(/^([^\s（]+)（([^）]+)）\s+(.+)/);
  if (p2) return { kanji: p2[1], kana: p2[2], vi: p2[3].trim(), en: '', pos: '' };

  // Pattern 3: "kanji [kana] Vietnamese"
  const p3 = line.match(/^([^\s\[]+)\s*\[([^\]]+)\]\s+(.+)/);
  if (p3) return { kanji: p3[1], kana: p3[2], vi: p3[3].trim(), en: '', pos: '' };

  // Pattern 4: "Japanese_word    Vietnamese_meaning" (tab or multi-space separated)
  const p4 = line.match(/^([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF～ー・]+)\s{2,}(.+)/);
  if (p4) {
    const jp = p4[1].trim();
    const vi = p4[2].trim();
    if (vi.length > 0) return { kanji: jp, kana: jp, vi, en: '', pos: '' };
  }

  // Pattern 5: split by first Vietnamese char occurrence
  const viStart = line.search(/[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/);
  if (viStart > 2) {
    const jp = line.slice(0, viStart).trim();
    const vi = line.slice(viStart).trim();
    if (jp.length > 0 && vi.length > 1) {
      return { kanji: jp, kana: jp, vi, en: '', pos: '' };
    }
  }

  return null;
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
