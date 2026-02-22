import React, { useState, useEffect } from 'react';
import { MapPin, Search, Heart, ClipboardList, User, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { detectBestCity } from '../utils/ipLocation';

const GlobalHeader = ({ transparentAtTop = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', phone: '' });
  const [currentCity, setCurrentCity] = useState(localStorage.getItem('preferred_city') || '定位中');
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

  useEffect(() => {
    let mounted = true;
    const preferred = localStorage.getItem('preferred_city');
    if (preferred) {
      setCurrentCity(preferred);
      return;
    }
    detectBestCity().then((city) => {
      if (!mounted) return;
      const finalCity = city || '未定位';
      setCurrentCity(finalCity);
      if (city) localStorage.setItem('preferred_city', city);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(loginForm);
      if (res.data && res.data.success) {
        const normalizedRole = res.data.role === 'USER' ? 'STAFF' : res.data.role;
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', normalizedRole);
        localStorage.setItem('username', res.data.username);
        setShowLogin(false);
        toast.success(
          <div className="px-2">
            <div className="text-sm font-bold">欢迎回来，{res.data.username}！</div>
          </div>
        );
        // 根据角色跳转
        if (normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER') navigate('/admin/dashboard');
        else if (normalizedRole === 'STAFF') navigate('/admin');
        else navigate('/');
      } else {
        toast.error(
          <div className="px-2">
            <div className="text-sm font-bold">{res.data.msg || "登录失败"}</div>
          </div>
        );
      }
    } catch (err) {
      toast.error(
        <div className="px-2">
          <div className="text-sm font-bold">服务器连接失败</div>
        </div>
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error(
        <div className="px-2">
          <div className="text-sm font-bold">两次密码不一致</div>
        </div>
      );
      return;
    }
    try {
      const res = await register({
        username: registerForm.username,
        password: registerForm.password,
        phone: registerForm.phone
      });
      if (res.data?.success) {
        toast.success(
          <div className="px-2">
            <div className="text-sm font-bold">注册成功，请登录</div>
          </div>
        );
        setLoginForm((prev) => ({ ...prev, username: registerForm.username, password: '' }));
        setRegisterForm({ username: '', password: '', confirmPassword: '', phone: '' });
        setAuthMode('login');
      } else {
        toast.error(
          <div className="px-2">
            <div className="text-sm font-bold">{res.data?.msg || '注册失败'}</div>
          </div>
        );
      }
    } catch (err) {
      toast.error(
        <div className="px-2">
          <div className="text-sm font-bold">服务器连接失败</div>
        </div>
      );
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
            <div
              className="hidden md:flex items-center text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/search-cars${currentCity && currentCity !== '未定位' && currentCity !== '定位中' ? `?city=${encodeURIComponent(currentCity)}` : ''}`);
              }}
            >
              <MapPin size={16} className="mr-1 text-yellow-400"/> {currentCity}
            </div>
          </div>

          {/* 中间：业务导航链接（这是之前漏掉的！） */}
          <nav className="hidden md:flex space-x-8 font-medium text-sm tracking-wide">
            <Link to="/search-cars" className="hover:text-yellow-400 transition-colors">我要买车</Link>
            <Link to="/sell-car" className="hover:text-yellow-400 transition-colors">高价卖车</Link>
            <Link to="/about" className="hover:text-yellow-400 transition-colors">关于我们</Link>
          </nav>

          {/* 右侧：功能区域 */}
          <div className="flex items-center space-x-6">
            <Search className="hover:text-yellow-400 cursor-pointer transition-colors" size={20} />
            <Heart className="hover:text-yellow-400 cursor-pointer transition-colors" size={20} />
            
            {/* C端用户和管理员都可查看“我的订单”页面 */}
            {['CUSTOMER', 'ADMIN'].includes(role) && (
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
                onClick={() => {
                  setAuthMode('login');
                  setShowLogin(true);
                }}
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-yellow-400 transition-colors"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 登录/注册弹窗 UI */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-black text-gray-900 mb-2">AutoMax 账户中心</h2>
            <p className="text-gray-400 text-sm mb-6 font-medium">一个账号，完成看车、预定与履约追踪</p>

            <div className="bg-gray-100 p-1 rounded-xl mb-6 flex">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-colors ${authMode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-colors ${authMode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                注册
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 min-h-[250px]">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">用户名</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 ring-blue-500/20 outline-none font-medium"
                    placeholder="请输入账号"
                    value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">密码</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 ring-blue-500/20 outline-none font-medium"
                    placeholder="请输入密码"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all">
                  登录并进入
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 min-h-[250px]">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">用户名</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 ring-blue-500/20 outline-none font-medium"
                    placeholder="建议 4-16 位"
                    value={registerForm.username}
                    onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">手机号（可选）</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 ring-blue-500/20 outline-none font-medium"
                    placeholder="用于门店联系"
                    value={registerForm.phone}
                    onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">设置密码</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 ring-blue-500/20 outline-none font-medium"
                    placeholder="设置密码"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">确认密码</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 ring-blue-500/20 outline-none font-medium"
                    placeholder="确认密码"
                    value={registerForm.confirmPassword}
                    onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                  完成注册
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400 font-medium">继续即表示你同意 AutoMax 平台服务条款</p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default GlobalHeader;
