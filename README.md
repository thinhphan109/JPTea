# 🍵 JPTea — Học Tiếng Nhật N5

> Web app ôn tập tiếng Nhật trình độ N5 theo giáo trình **Minna no Nihongo Sơ cấp I**, với quiz tương tác, AI gợi ý, TTS phát âm và animation hoa anh đào.

![Theme](https://img.shields.io/badge/theme-Sakura%20Light%2FDark-fda4af) ![Stack](https://img.shields.io/badge/stack-Vite%20%2B%20Vanilla%20JS-646cff) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Tính năng

- 📚 **5 loại quiz**: Từ vựng cơ bản, Từ vựng luyện tập, Đọc hiểu, Ngữ pháp, Kanji
- 🎨 **Theme Sakura**: Light & Dark mode với hoa anh đào rơi nhẹ
- 🎵 **Sound effects**: Đúng/Sai/Hoàn thành (Web Audio API)
- 🔊 **TTS phát âm**: Tự đọc từ tiếng Nhật khi trả lời sai (reinforcement)
- 🤖 **AI gợi ý**: OpenAI-compatible (Groq/OpenAI/OpenRouter/Ollama/Custom)
- 🔒 **Server-side AI**: API key lưu trên server, không expose ra browser
- 💾 **Auto-save**: Resume quiz đang làm dở (24h expire)
- 📱 **Mobile responsive**: 3 breakpoints (480/768/1024)
- 🌐 **i18n ready**: Có sẵn tiếng Việt, dễ thêm tiếng Anh

## 🚀 Setup

```bash
# 1. Install
npm install

# 2. Cấu hình AI (optional)
cp .env.example .env
# Sửa .env: AI_API_KEY, AI_PROVIDER, AI_ENABLED=true

# 3. Run dev
npm run dev

# 4. Build production
npm run build
```

## 🔧 Tạo data quiz mới

```bash
# 1. Tạo source file: scripts/sources/bai-XX.json
# 2. Generate quiz files:
npm run gen -- 6        # Bài 6
npm run gen:all         # Tất cả bài có source
```

Format `scripts/sources/bai-XX.json`:

```json
{
  "lesson": 6,
  "title": "...",
  "vocab": [
    { "kanji": "食べます", "kana": "たべます", "vi": "ăn", "en": "eat", "pos": "động từ" }
  ],
  "grammar": [
    {
      "title": "～を ＋ V",
      "structure": "N を V",
      "viExplain": "Trợ từ を chỉ tân ngữ",
      "examples": [...]
    }
  ]
}
```

Generator tự tạo 5 file quiz JSON (vocab-basic, vocab-practice, reading, grammar, kanji) với ~270 câu.

## 🏗️ Architecture

```
JPTea/
├── api/                # Serverless functions (Vercel-compatible)
│   ├── chat.js         # POST /api/chat → AI proxy
│   └── config.js       # GET /api/config → public info
├── server/
│   ├── ai-proxy.js     # Server-side AI logic
│   └── vite-api-plugin.js  # Dev middleware (mimics Vercel)
├── src/
│   ├── components/     # furigana, header, sakura
│   ├── data/lessons.js # 25 bài metadata
│   ├── i18n/           # vi.js (vietnamese)
│   ├── lib/            # ai, loader, sounds, storage, theme, tts
│   ├── pages/          # home, lesson, quiz, settings
│   └── styles/         # 11 CSS files (modular)
├── scripts/
│   ├── sources/        # Vocab truth data (per lesson)
│   └── generate-quiz.js  # Quiz generator script
├── public/
│   ├── data/           # Generated quiz JSON
│   ├── favicon.svg
│   └── logo.svg
├── index.html, lesson.html, quiz.html, settings.html
└── vite.config.js
```

## 🔒 Security Model

```
┌─────────┐  POST /api/chat  ┌────────┐  HTTPS  ┌──────────┐
│ Browser │ ───────────────► │ Server │ ──────► │ Provider │
└─────────┘                  └────────┘         └──────────┘
                                ▲
                          AI_API_KEY (env)
```

**API key chỉ tồn tại trên server.** Browser không bao giờ thấy key trong DevTools, network tab, hay localStorage.

## 📦 AI Providers

Set `AI_PROVIDER` trong `.env`:

| Provider     | Free?                    | URL                                  |
| ------------ | ------------------------ | ------------------------------------ |
| `groq`       | ✅ Free                  | https://console.groq.com/keys        |
| `openai`     | 💰 Paid                  | https://platform.openai.com/api-keys |
| `openrouter` | ✅ Free models           | https://openrouter.ai/keys           |
| `together`   | 💰 $25 credit            | https://api.together.xyz             |
| `ollama`     | ✅ Local                 | localhost:11434                      |
| `custom`     | Bất kỳ OpenAI-compatible | (vLLM, LM Studio, etc.)              |

## 🎯 Roadmap

- [x] 5 quiz types với 5 bài đầu
- [x] AI hint button + server-side proxy
- [x] Sound effects + auto-TTS
- [x] Mobile responsive
- [ ] Data Bài 6-25
- [ ] PWA + offline mode
- [ ] Streak counter + achievements
- [ ] Spaced repetition (Anki-style)

## 📄 License

MIT — based on **Minna no Nihongo Sơ cấp I** vocabulary (educational fair use).
