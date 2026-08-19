import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],

      manifest: {
        name: "Purchase Management System",
        short_name: "PMS",
        description:
          "Sistem informasi pembelian - kelola supplier, barang, dan transaksi pembelian.",
        lang: "id",
        theme_color: "#2563eb",
        background_color: "#f4f7fc",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },


      //   npm run build && npm run preview
      devOptions: {
        enabled: false,
      },

      workbox: {
        navigateFallback: "/index.html",

        runtimeCaching: [
          // Data GET dari API Laravel (items, suppliers, transactions)
          // -> NetworkFirst: coba internet dulu, kalau gagal/timeout
          //    pakai data terakhir yang tersimpan di cache.
          {
            urlPattern: ({ url }) => url.pathname.includes("/api/"),
            method: "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "pms-api-cache",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 hari
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Aset statis (JS/CSS) hasil build
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "pms-assets" },
          },

          // Gambar/icon
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "pms-images",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
              },
            },
          },
        ],
      },
    }),
  ],
});