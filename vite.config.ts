// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    viteCompression(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Purple IPTV",
        short_name: "PurpleTV",
        theme_color: "#0D0D12",
        background_color: "#0D0D12",
        display: "standalone",
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
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          services: [
            "./src/services/cacheService.ts",
            "./src/services/xtreamService.ts",
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
});
