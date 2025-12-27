import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 註冊 PWA Service Worker
import { registerSW } from 'virtual:pwa-register'
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('有新版本可用，是否更新？')) {
      updateSW(true)
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)