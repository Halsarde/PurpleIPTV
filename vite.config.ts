// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // ⚠️ غيّرناها من "./" إلى "/" حتى لا يفشل تحميل الـ bundle في Netlify
  base: "/",

publicDir: "public",

  plugins: [
    react(),

    // ✅ ضغط الملفات النهائية لتسريع التحميل (Gzip + Brotli)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),

    // ✅ إعداد الـ PWA (اختياري، لكنه مضبوط لتجنب مشاكل الكاش القديمة)
    VitePWA({
      registerType: "prompt", // منع autoUpdate لأنه يسبب تعليق بالسبلاش عند وجود cache قديم
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "Purple IPTV",
        short_name: "PurpleTV",
        theme_color: "#0D0D12",
        background_color: "#0D0D12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/index.html",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          vendor: ["axios", "dayjs"], // ✅ فصل المكتبات العامة لتحسين التحميل
          services: [
            "./src/services/xtreamService",
            "./src/services/cacheService",
          ],
        },
      },
    },
  },

  esbuild: {
    target: "esnext",
    minify: true,
    legalComments: "none",
  },

  // ✅ تحسينات dev server فقط (اختياري)
  server: {
    port: 5173,
    open: true,
    strictPort: true,
  },
});
