import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CarFront, FileText, ChevronRight, 
  UserCircle, ClipboardList, BellRing, MapPin 
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DING_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAK8wAHCwsLCwsLCwsLFhYWFhYWFhYWFhYmJiYmJiYmJiYmJiY2NjY2NjY2NjY2NjpKSkpKSkpKSkpKSkpLS0tLS0tLS0tLS0tLS1ZWVlZWVlZWVlZWVlZWVmZmZmZmZmZmZmZmZmpqampqampqampqamr/AAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zgMAAAABpAnYAYAAAADDY6+v7/7f///v/v/v/v///83/87kGAAAAn9L/+m5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABOAncAsAAAAAAmXv/v/+9u/v///v7/727/////83/87mGAAAAX9H/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABVAnAIsAAAAAAXv///+9/9///u//v//v////v/9X/87lGAAAAX9L/+m5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABVAnIAsAAAAAAXv/v////9/9///+//////9X/87mGAAAAX9L/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABUAnEAsAAAAAAmXv//9+7/7////v////v////9X/87kGAAAAX9H/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABKAnEAsAAAAAAXv////+////v/v/v//////9X/87kGAAAAX9L/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAAVW5pdHkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zgMAAAABVAnYAsAAAAAAmXv///+////v/v/v////v//9X/87mGAAAAX9L/+i5AIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const noticeAudio = new Audio(DING_SOUND);

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('role');

  // 定义哪些是“内部员工”，准许进入后台
  const internalRoles = ['ADMIN', 'MANAGER', 'STAFF', 'USER'];

  useEffect(() => {
    // 1. 权限拦截：如果不属于内部员工角色，直接踢回首页
    if (!internalRoles.includes(userRole)) {
      toast.error("权限不足：只有内部人员可进入后台");
      navigate('/');
      return;
    }

    // 2. 建立 WebSocket 连接
    const ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws/admin`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        noticeAudio.play().catch(() => {});
        toast.info(
          <div className="flex flex-col">
            <span className="font-black text-gray-900 flex items-center">
              <BellRing size={16} className="mr-2 text-blue-500 animate-bounce" /> {data.title}
            </span>
            <span className="text-xs text-gray-500 mt-1 leading-relaxed">{data.body}</span>
          </div>, 
          { position: "bottom-right", autoClose: 8000 }
        );
      } catch (err) { console.error("解析通知消息失败", err); }
    };
    return () => ws.close();
  }, [userRole, navigate]);

  // 🌟 核心修复：如果不是内部员工，渲染空；如果是，则渲染完整后台
  if (!internalRoles.includes(userRole)) return null;

  // 🌟 侧边栏逻辑：ADMIN 和 MANAGER 拥有管理权
  const menuItems = [
    { name: '数据概览', icon: <LayoutDashboard size={20}/>, path: '/admin/dashboard' },
    { name: '车辆管理', icon: <CarFront size={20}/>, path: '/admin' },
    { name: '订单管理', icon: <FileText size={20}/>, path: '/admin/orders' },
    { name: '线索管理', icon: <ClipboardList size={20}/>, path: '/admin/leads' },
    ...((userRole === 'ADMIN' || userRole === 'MANAGER') ? [
      { name: '门店管理', icon: <MapPin size={20}/>, path: '/admin/stores' },
      { name: '人员管理', icon: <UserCircle size={20}/>, path: '/admin/users' }
    ] : [])
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <ToastContainer toastStyle={{ borderRadius: '20px', border: '1px solid #f0f0f0' }} />
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
              {userRole === 'ADMIN' ? '超级管理员' : userRole === 'MANAGER' ? '店长端' : '员工端'}
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