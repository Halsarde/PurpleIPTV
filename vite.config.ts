// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // ✅ Netlify يحتاج base مطلق وليس نسبي
  base: "/",

  publicDir: "public",

  plugins: [
    react(),

    // ✅ ضغط الملفات لتسريع التحميل
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),

    // ✅ إعداد PWA الصحيح مع مسار icons/
    VitePWA({
      registerType: "prompt", // يمنع تعليق السبلاش عند وجود كاش قديم
      includeAssets: [
        "icons/favicon.ico",
        "icons/logo.png",
        "icons/pwa-192x192.png",
        "icons/pwa-maskable-512x512.png",
      ],
      manifest: {
        name: "Purple IPTV",
        short_name: "PurpleTV",
        description: "أفضل تطبيق لمشاهدة القنوات والبث المباشر بجودة عالية.",
        theme_color: "#0D0D12",
        background_color: "#0D0D12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/index.html",
        icons: [
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
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
          vendor: ["axios", "dayjs"], // ✅ فصل المكتبات الثقيلة
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

  server: {
    port: 5173,
    open: true,
    strictPort: true,
  },
});
