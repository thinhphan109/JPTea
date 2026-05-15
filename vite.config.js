import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import { apiRoutesPlugin } from "./server/vite-api-plugin.js";

export default defineConfig(({ mode }) => {
  // Load .env (server-only vars NOT prefixed with VITE_)
  const env = loadEnv(mode, process.cwd(), '');
  // Push to process.env so server middleware can read them
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }

  return {
    plugins: [apiRoutesPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          lesson: resolve(__dirname, "lesson.html"),
          quiz: resolve(__dirname, "quiz.html"),
          settings: resolve(__dirname, "settings.html"),
        },
      },
    },
  };
});
