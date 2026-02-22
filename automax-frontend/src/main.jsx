// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 🌟 必须在加载任何地图组件前配置！
// 这两个字符串在你的高德控制台 Key 管理页面是成对出现的
window._AMapSecurityConfig = {
  securityJsCode: 'dc09a0dc4cdb8203d293fb21a10b4681', 
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)