/**
 * Lessons data — Minna no Nihongo Sơ cấp I (25 bài)
 */

export const LESSONS = [
  { id: 1, title: 'はじめまして', titleVi: 'Giới thiệu bản thân' },
  { id: 2, title: 'これ・それ・あれ', titleVi: 'Đây / Đó / Kia' },
  { id: 3, title: 'ここ・そこ・あそこ', titleVi: 'Vị trí ở đây/đó/kia' },
  { id: 4, title: 'いま なんじですか', titleVi: 'Bây giờ mấy giờ?' },
  { id: 5, title: '〜へ いきます', titleVi: 'Đi đến...' },
  { id: 6, title: 'いっしょに〜', titleVi: 'Cùng làm gì đó' },
  { id: 7, title: '〜で〜を〜', titleVi: 'Bằng phương tiện gì' },
  { id: 8, title: 'きれいな まち', titleVi: 'Tính từ' },
  { id: 9, title: 'すきです', titleVi: 'Thích / Không thích' },
  { id: 10, title: 'あります・います', titleVi: 'Có (vật/người)' },
  { id: 11, title: 'いくつ ありますか', titleVi: 'Đếm số lượng' },
  { id: 12, title: 'きのう〜でした', titleVi: 'Quá khứ tính từ' },
  { id: 13, title: '〜が ほしい', titleVi: 'Muốn có cái gì' },
  { id: 14, title: 'みて ください', titleVi: 'Thể て + ください' },
  { id: 15, title: '〜ても いいです', titleVi: 'Cho phép / Cấm đoán' },
  { id: 16, title: '〜てから〜', titleVi: 'Nối hành động' },
  { id: 17, title: '〜ないで ください', titleVi: 'Thể ない' },
  { id: 18, title: 'こと が できます', titleVi: 'Có thể làm được' },
  { id: 19, title: 'たことが あります', titleVi: 'Đã từng...' },
  { id: 20, title: '〜と おもいます', titleVi: 'Thể thông thường' },
  { id: 21, title: '〜と おもいます', titleVi: 'Tôi nghĩ rằng...' },
  { id: 22, title: 'どんな〜', titleVi: 'Câu định ngữ' },
  { id: 23, title: '〜とき・〜と', titleVi: 'Khi / Nếu' },
  { id: 24, title: 'てつだいましょうか', titleVi: 'Cho/Nhận hành động' },
  { id: 25, title: 'おせわに なりました', titleVi: 'Câu điều kiện' },
];

export const QUIZ_TYPES_META = [
  {
    type: 'vocab-basic',
    icon: '📝',
    title: 'Từ vựng cơ bản',
    desc: 'Dịch từ tiếng Nhật sang tiếng Việt. Kanji có furigana.',
    questions: 50,
    cssClass: 'quiz-card--vocab',
  },
  {
    type: 'vocab-practice',
    icon: '🏋️',
    title: 'Từ vựng luyện tập',
    desc: 'Không furigana, 2 chiều (Nhật↔Việt). Xáo trộn câu hỏi.',
    questions: 65,
    cssClass: 'quiz-card--practice',
  },
  {
    type: 'reading',
    icon: '📖',
    title: 'Đọc hiểu',
    desc: '3 đoạn văn ngắn, mỗi đoạn 7 câu hỏi từ dễ đến khó.',
    questions: 21,
    cssClass: 'quiz-card--reading',
  },
  {
    type: 'grammar',
    icon: '⚙️',
    title: 'Ngữ pháp & Trợ từ',
    desc: 'Cấu trúc câu, trợ từ は/が/を/に/で/へ.',
    questions: 50,
    cssClass: 'quiz-card--grammar',
  },
  {
    type: 'kanji',
    icon: '漢',
    title: 'Ôn tập Kanji',
    desc: 'Đọc kanji trong câu, dịch sang hiragana hoặc tiếng Việt.',
    questions: 60,
    cssClass: 'quiz-card--kanji',
  },
];
