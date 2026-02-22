import React, { useState, useEffect } from 'react';
import { MapPin, Search, Heart, ClipboardList, User, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api'; //
import { Link } from 'react-router-dom';

const GlobalHeader = ({ transparentAtTop = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  // 获取登录状态
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(loginForm);
      if (res.data && res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('username', res.data.username);
        setShowLogin(false);
        alert(`欢迎回来，${res.data.username}！`);
        // 根据角色跳转
        if (res.data.role === 'USER') navigate('/admin/dashboard');
        else navigate('/');
      } else {
        alert(res.data.msg || "登录失败");
      }
    } catch (err) {
      alert("服务器连接失败");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };

  const bgClass = (transparentAtTop && !isScrolled) 
    ? 'bg-transparent py-6' 
    : 'bg-black/95 backdrop-blur-xl shadow-2xl py-4';

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${bgClass}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center text-white">
          
          {/* 左侧：Logo 与 定位 */}
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}>
            <span className="font-extrabold text-3xl tracking-tighter text-yellow-400 group-hover:scale-105 transition-transform">
              AutoMax
            </span>
            <div className="hidden md:flex items-center text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors">
              <MapPin size={16} className="mr-1 text-yellow-400"/> 成都市 ▾
            </div>
          </div>

          {/* 中间：业务导航链接（这是之前漏掉的！） */}
          <nav className="hidden md:flex space-x-8 font-medium text-sm tracking-wide">
            <a href="#" className="hover:text-yellow-400 transition-colors">我要买车</a>
            <Link to="/sell-car" className="hover:text-yellow-400 transition-colors">高价卖车</Link>
            <a href="#" className="hover:text-yellow-400 transition-colors">服务保障</a>
          </nav>

          {/* 右侧：功能区域 */}
          <div className="flex items-center space-x-6">
            <Search className="hover:text-yellow-400 cursor-pointer transition-colors" size={20} />
            <Heart className="hover:text-yellow-400 cursor-pointer transition-colors" size={20} />
            
            {/* 只有 ADMIN (客户) 才显示我的订单入口 */}
            {role === 'ADMIN' && (
              <div 
                onClick={() => navigate('/my-orders')}
                className="flex items-center space-x-1.5 hover:text-yellow-400 cursor-pointer transition-colors font-medium text-sm"
              >
                <ClipboardList size={20} />
                <span className="hidden sm:inline-block">我的订单</span>
              </div>
            )}

            {/* 登录/用户信息动态显示 */}
            {token ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                  <User size={14} className="text-yellow-400" />
                  <span className="text-sm font-bold">{username}</span>
                </div>
                <LogOut onClick={handleLogout} className="hover:text-red-400 cursor-pointer transition-colors" size={20} />
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-yellow-400 transition-colors"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 登录弹窗 UI */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-black text-gray-900 mb-2">欢迎登录</h2>
            <p className="text-gray-400 text-sm mb-8 font-medium">AutoMax 智能二手车交易平台</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">用户名</label>
                <input 
                  type="text" required
                  className="w-full mt-1 px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 ring-blue-500/20 outline-none font-medium"
                  placeholder="请输入账号"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">密码</label>
                <input 
                  type="password" required
                  className="w-full mt-1 px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 ring-blue-500/20 outline-none font-medium"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 active:scale-95">
                立即进入系统
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 font-bold leading-relaxed">
                测试账号：员工 staff01 / 客户 customer01 <br/>
                (密码统一为 123456)
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalHeader;