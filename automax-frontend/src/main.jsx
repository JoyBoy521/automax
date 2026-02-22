// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { toast } from 'react-toastify'
import App from './App'
import './index.css'

// 🌟 必须在加载任何地图组件前配置！
// 这两个字符串在你的高德控制台 Key 管理页面是成对出现的
window._AMapSecurityConfig = {
  securityJsCode: 'dc09a0dc4cdb8203d293fb21a10b4681', 
};

if (!window.__automaxAlertPatched) {
  const nativeAlert = window.alert.bind(window);
  window.alert = (message) => {
    const text = typeof message === 'string' ? message : String(message ?? '');
    if (!text.trim()) {
      nativeAlert(message);
      return;
    }
    toast.info(
      <div className="px-2">
        <div className="text-sm font-bold">{text}</div>
      </div>
    );
  };
  window.__automaxAlertPatched = true;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
