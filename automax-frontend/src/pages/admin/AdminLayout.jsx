import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CarFront, FileText, ChevronRight, 
  UserCircle, ClipboardList, BellRing, MapPin 
} from 'lucide-react';
import { cssTransition, toast } from 'react-toastify';

const DING_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAK8wAHCwsLCwsLCwsLFhYWFhYWFhYWFhYmJiYmJiYmJiYmJiY2NjY2NjY2NjY2NjpKSkpKSkpKSkpKSkpLS0tLS0tLS0tLS0tLS1ZWVlZWVlZWVlZWVlZWVmZmZmZmZmZmZmZmZmpqampqampqampqamr/AAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zgMAAAABpAnYAYAAAADDY6+v7/7f///v/v/v/v///83/87kGAAAAn9L/+m5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABOAncAsAAAAAAmXv/v/+9u/v///v7/727/////83/87mGAAAAX9H/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABVAnAIsAAAAAAXv///+9/9///u//v//v////v/9X/87lGAAAAX9L/+m5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABVAnIAsAAAAAAXv/v////9/9///+//////9X/87mGAAAAX9L/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABUAnEAsAAAAAAmXv//9+7/7////v////v////9X/87kGAAAAX9H/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABKAnEAsAAAAAAXv////+////v/v/v//////9X/87kGAAAAX9L/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABVAnYAsAAAAAAmXv///+////v/v/v////v//9X/87mGAAAAX9L/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const noticeAudio = new Audio(DING_SOUND);
const ISLAND_TOAST_ID = 'admin-dynamic-island';
const islandTransition = cssTransition({
  enter: 'island-drop-enter',
  exit: 'island-drop-exit',
  collapse: false
});
const islandToastBase = {
  position: "top-center",
  autoClose: 3800,
  closeButton: false,
  hideProgressBar: true,
  pauseOnHover: true,
  draggable: false,
  transition: islandTransition
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('role');
  const normalizedRole = userRole === 'USER' ? 'STAFF' : userRole;
  const noticeBatchRef = useRef({ count: 0, latest: null, timer: null });

  // 定义哪些是“内部员工”，准许进入后台
  const internalRoles = ['ADMIN', 'MANAGER', 'STAFF'];

useEffect(() => {
    // 1. 权限拦截：如果不属于内部员工角色，直接踢回首页
    if (!internalRoles.includes(normalizedRole)) {
      toast.error("权限不足：只有内部人员可进入后台", islandToastBase);
      navigate('/');
      return;
    }

    // 2. 建立 WebSocket 连接
const ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws/admin`);
    
    const flushNoticeBatch = () => {
      const batch = noticeBatchRef.current;
      if (!batch.count || !batch.latest) return;
      const latest = batch.latest;
      const isSingle = batch.count === 1;
      toast.dismiss(ISLAND_TOAST_ID);
      toast.info(
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
            <BellRing size={14} className="text-cyan-200" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm leading-none">
              {isSingle ? latest.title : `${batch.count} 条新提醒`}
            </div>
            <div className="text-[11px] text-white/70 leading-none mt-1 truncate max-w-[260px]">
              {isSingle ? (latest.body || '请尽快处理') : `最新：${latest.title}${latest.body ? ` · ${latest.body}` : ''}`}
            </div>
          </div>
        </div>,
        {
          ...islandToastBase,
          toastId: ISLAND_TOAST_ID,
          toastClassName: 'rounded-full bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl min-h-[52px] px-3',
          bodyClassName: 'p-0'
        }
      );
      noticeBatchRef.current = { count: 0, latest: null, timer: null };
    };

    const enqueueNotice = (data) => {
      const current = noticeBatchRef.current;
      if (current.timer) clearTimeout(current.timer);
      noticeBatchRef.current = {
        count: current.count + 1,
        latest: data,
        timer: setTimeout(flushNoticeBatch, 420)
      };
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        noticeAudio.play().catch(() => {});
        window.dispatchEvent(new CustomEvent('admin:notice', { detail: data }));
        enqueueNotice(data);
      } catch (err) { console.error("解析通知消息失败", err); }
    };

    ws.onerror = () => {
      toast.warn(
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
            <BellRing size={14} className="text-amber-200" />
          </div>
          <span className="font-bold text-white text-sm">通知链路断开，系统会自动重连</span>
        </div>,
        {
          ...islandToastBase,
          toastId: `${ISLAND_TOAST_ID}-ws-error`,
          autoClose: 2500,
          toastClassName: 'rounded-full bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl min-h-[52px] px-3',
          bodyClassName: 'p-0'
        }
      );
    };

    // 🌟 核心修复：更优雅的清理逻辑，专门对付 React 18 StrictMode
    return () => {
      if (noticeBatchRef.current.timer) {
        clearTimeout(noticeBatchRef.current.timer);
      }
      if (ws.readyState === WebSocket.CONNECTING) {
        // 如果还在连接中就被 React 卸载，告诉它连上后马上关闭
        ws.onopen = () => ws.close();
      } else if (ws.readyState === WebSocket.OPEN) {
        // 如果已经连接正常，直接关闭
        ws.close();
      }
    };
  }, [normalizedRole, navigate]);

  // 🌟 核心修复：如果不是内部员工，渲染空；如果是，则渲染完整后台
  if (!internalRoles.includes(normalizedRole)) return null;

  // 🌟 侧边栏逻辑：ADMIN 和 MANAGER 拥有管理权
  const menuItems = [
    { name: '数据概览', icon: <LayoutDashboard size={20}/>, path: '/admin/dashboard' },
    { name: '车辆管理', icon: <CarFront size={20}/>, path: '/admin' },
    { name: '订单管理', icon: <FileText size={20}/>, path: '/admin/orders' },
    { name: '收车审核管理', icon: <ClipboardList size={20}/>, path: '/admin/leads' },
    ...(normalizedRole === 'ADMIN' ? [
      { name: '门店管理', icon: <MapPin size={20}/>, path: '/admin/stores' }
    ] : []),
    ...((normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER') ? [
      { name: '人员管理', icon: <UserCircle size={20}/>, path: '/admin/users' }
    ] : [])
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-2xl font-black text-yellow-400">AutoMax</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map(item => (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}
            >
              {item.icon} <span className="ml-3 font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center text-sm text-gray-500">
            后台管理 <ChevronRight size={14} className="mx-2"/> 
            {menuItems.find(m => m.path === location.pathname)?.name || '概览'}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-700">
              {normalizedRole === 'ADMIN' ? '超级管理员' : normalizedRole === 'MANAGER' ? '店长端' : '员工端'}
            </span>
            <UserCircle className="text-gray-400" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
