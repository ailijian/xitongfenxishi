import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
const base = process.env.BASE_PATH || "/";
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*.png", "icons/*.svg"],
      manifest: {
        name: "软考冲刺 · 系统分析师",
        short_name: "软考冲刺",
        description: "知识点掌握驱动的系统分析师学习与原创模拟训练",
        lang: "zh-CN",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#f4f7f6",
        theme_color: "#126b60",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,png,svg,ico,webmanifest}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|scheduler|react-router)/,
            },
            {
              name: "storage",
              test: /node_modules[\\/](dexie|dexie-react-hooks)/,
            },
            { name: "validation", test: /node_modules[\\/]zod/ },
            { name: "content", test: /src[\\/]data[\\/].*\.json$/ },
          ],
        },
      },
    },
  },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
