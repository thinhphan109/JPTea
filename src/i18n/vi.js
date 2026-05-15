/**
 * Vietnamese locale — default language
 */
export const vi = {
  common: {
    back: '← Quay lại',
    home: '← Trang chủ',
    retry: '🔄 Thử lại',
    cancel: 'Hủy',
    save: '💾 Lưu',
    reset: '🗑️ Reset',
    loading: 'Đang tải...',
    error: 'Lỗi',
  },

  quiz: {
    next: 'Câu kế →',
    finish: 'Xem kết quả →',
    progress: '{current} / {total}',
    hint: '💡 Gợi ý',
    hintLoading: '⏳ Đang hỏi AI...',
    hintRetry: '💡 Thử lại',
    hintLabel: '💡 Gợi ý:',
    answeredCorrect: '✅',
    answeredWrong: '❌',
    listenButton: 'Nghe phát âm',

    resumePrompt: '📌 Bạn đang làm dở (câu {current}/{total}, đúng {score} câu). Tiếp tục?',
    resumeContinue: 'Tiếp tục',
    resumeRestart: 'Làm lại',

    result: {
      retry: 'Làm lại 🔄',
      chooseAnother: 'Chọn quiz khác',
      perfect: '🎉 Hoàn hảo!',
      reviewTitle: '📋 Câu sai ({count})',
      reviewYourPick: 'Bạn chọn:',
      reviewCorrect: 'Đáp án:',
    },

    grades: {
      excellent: 'Xuất sắc!',
      great: 'Giỏi lắm!',
      good: 'Khá tốt',
      needsPractice: 'Cần ôn thêm',
      keepGoing: 'Cố gắng lên!',
    },
  },

  // AI prompts — instructions to send to LLM. Always describes target output language.
  ai: {
    systemTutor: 'Bạn là gia sư tiếng Nhật N5 thân thiện. LUÔN trả lời bằng tiếng Việt. Đưa gợi ý NGẮN (1-2 câu) mà KHÔNG tiết lộ đáp án. Giúp học viên tự suy luận.',
    quizHintUser: 'Học viên đang bí câu trắc nghiệm tiếng Nhật: "{question}". Các đáp án: {options}. Hãy đưa một gợi ý ngắn bằng tiếng Việt mà không lộ đáp án đúng.',
    explainGrammarUser: 'Giải thích đơn giản cấu trúc ngữ pháp N5 này bằng tiếng Việt: "{grammar}". Bao gồm 2 câu ví dụ có furigana.',
    generateSentenceUser: 'Tạo 3 câu tiếng Nhật đơn giản N5 dùng từ "{word}". Format: Tiếng Nhật (có furigana) | Dịch tiếng Việt.',
    pronunciationUser: 'Cách phát âm "{word}" trong tiếng Nhật. Giải thích trọng âm và lỗi thường gặp với người Việt. Trả lời bằng tiếng Việt.',
  },

  errors: {
    notFound: {
      icon: '📝',
      title: 'Quiz này chưa có',
      hint: 'Quiz cho bài này đang được cập nhật. Vui lòng quay lại sau hoặc chọn bài khác.',
    },
    invalidUrl: {
      icon: '🚫',
      title: 'URL không hợp lệ',
    },
    network: {
      icon: '📡',
      title: 'Lỗi kết nối',
      hint: 'Kiểm tra kết nối internet hoặc thử lại.',
    },
    invalidData: {
      icon: '📦',
      title: 'Dữ liệu quiz lỗi',
      hint: 'File dữ liệu bị hỏng. Vui lòng báo lại để fix.',
    },
    aiNotConfigured: 'AI chưa được cấu hình trên server. Admin cần set AI_API_KEY và AI_ENABLED=true.',
  },

  settings: {
    title: '⚙️ Cài đặt AI',
    subtitle: 'Trạng thái AI provider của hệ thống.',
    statusChecking: '⏳ Đang kiểm tra trạng thái AI...',
    statusActive: 'Đang hoạt động',
    statusNotConfigured: 'Chưa cấu hình',
    notConfiguredDesc: 'AI chưa được kích hoạt trên server. Tính năng 💡 Gợi ý sẽ không hiện trong quiz.',
    provider: 'Provider',
    model: 'Model',
    apiKey: 'API Key',
    apiKeyValue: '🔒 Lưu trên server (không expose)',
    test: '🧪 Test kết nối',
    testing: '⏳ Đang test...',
    testCalling: '⏳ Đang gọi AI...',
    testSuccess: '✅ AI hoạt động. Trả lời: "{reply}"',
  },
};
