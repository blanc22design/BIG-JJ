import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '大ㄐㄐ養成記',
        short_name: '大ㄐㄐ',
        description: '你的 AI 智能健身教練',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // 重要：這行讓它全螢幕執行
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // 請在 public 資料夾放入一張 192x192 的圖片
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // 請在 public 資料夾放入一張 512x512 的圖片
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})