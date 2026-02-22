import React, { useState } from 'react';
import { Search, CarFront, Banknote, ShieldCheck, Zap ,ChevronDown} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';

const HeroSection = () => {
  const [ref, isVisible] = useScrollReveal(0.2);
  const [activeTab, setActiveTab] = useState('buy');
  const [brand, setBrand] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (priceRange) params.set('price', priceRange);
    if (city) params.set('city', city);
    if (keyword.trim()) params.set('q', keyword.trim());
    if (city) localStorage.setItem('preferred_city', city);
    navigate(`/search-cars?${params.toString()}`);
  };
  
  return (
    <section ref={ref} className="relative w-full min-h-screen flex items-center bg-[#050505] overflow-hidden">
      
      {/* =========================================
          沉浸式背景层 - 增加“驶入”动画逻辑
          ========================================= */}
      <div className="absolute top-0 right-0 w-full lg:w-[85%] h-full z-0">
        <img
          src="https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&q=80&w=1800"
          alt="Hero Background"
          className={`w-full h-full object-cover object-right transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${
              isVisible ? 'translate-x-0 scale-100 blur-0 opacity-100' : 'translate-x-[20%] scale-110 blur-xl opacity-0'
          }`}
          // 这里的关键在于：
          // 1. translate-x-[20%] 让车初始位置在右侧屏幕外
          // 2. scale-110 配合位移产生一种冲刺感
          // 3. duration-[1500ms] 确保“驶入”过程优雅不突兀
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505] via-[25%] to-transparent to-[55%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent via-[15%] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent via-[10%] to-transparent h-40" />
      </div>

      {/* =========================================
          内容主体层
          ========================================= */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-lg">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-yellow-400 text-sm font-medium mb-6 backdrop-blur-md transform transition-all duration-700 delay-100 w-max ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Zap size={14} className="mr-1.5" /> 智能精选 · 透明交易
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] mb-8 tracking-tight">
            <div className={`transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>买卖二手车</div>
            <div className={`transform transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              本该如此<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">简单透明</span>
            </div>
          </h1>

          {/* 交互面板组件 */}
          <div className={`bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-2.5 shadow-2xl transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* ... 之前的 Tab 和 Input 逻辑保持不变 ... */}
            <div className="flex bg-black/40 rounded-2xl p-1.5 mb-3">
              <button onClick={() => setActiveTab('buy')} className={`flex-1 flex justify-center items-center py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'buy' ? 'bg-yellow-400 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>
                <CarFront size={18} className="mr-2" /> 我要买车
              </button>
              <button onClick={() => setActiveTab('sell')} className={`flex-1 flex justify-center items-center py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'sell' ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                <Banknote size={18} className="mr-2" /> 免费估价卖车
              </button>
            </div>

            {activeTab === 'buy' && (
               <div className="p-2 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="relative group">
                    <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full h-12 appearance-none bg-black/55 text-white border border-white/15 rounded-2xl px-4 pr-10 text-sm outline-none transition-all group-hover:border-white/30 focus:border-yellow-400/60">
                      <option value="">全部品牌</option>
                      <option value="宝马">宝马</option>
                      <option value="奔驰">奔驰</option>
                      <option value="奥迪">奥迪</option>
                      <option value="丰田">丰田</option>
                      <option value="本田">本田</option>
                      <option value="特斯拉">特斯拉</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative group">
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full h-12 appearance-none bg-black/55 text-white border border-white/15 rounded-2xl px-4 pr-10 text-sm outline-none transition-all group-hover:border-white/30 focus:border-yellow-400/60">
                      <option value="">不限价格</option>
                      <option value="0-10">10万以下</option>
                      <option value="10-20">10-20万</option>
                      <option value="20-999">20万以上</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                  <div className="relative group">
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="所在城市（如：成都市）"
                      className="w-full h-12 bg-black/55 text-white border border-white/15 rounded-2xl px-4 text-sm outline-none transition-all group-hover:border-white/30 focus:border-yellow-400/60 placeholder-gray-500"
                    />
                  </div>
              </div>
                <div className="flex items-stretch gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0 flex items-center bg-black/55 rounded-2xl sm:rounded-r-none border border-white/15 focus-within:border-yellow-400/60 transition-colors">
                    <div className="flex items-center pl-5 pr-2">
                      <Search size={18} className="text-gray-500" />
                    </div>
                    <input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      type="text"
                      placeholder="直接搜索如: 思域 2022款"
                      className="w-full bg-transparent text-white text-sm py-3.5 outline-none placeholder-gray-500"
                    />
                    </div>
                    <button
                    onClick={handleSearch}
                    className="shrink-0 bg-yellow-400 text-black px-8 font-black hover:bg-yellow-300 transition-colors rounded-2xl sm:rounded-l-none">
                    找车
                  </button>
                   </div>
                </div>
            )}

            {activeTab === 'sell' && (
              <div className="p-2 animate-in fade-in duration-300">
                <p className="text-xs text-gray-400 mb-3 px-1">输入车架号或手机号，获取全网精准报价</p>
                <div className="flex bg-black/40 rounded-xl border border-white/10 overflow-hidden focus-within:border-white/30 transition-colors mb-3">
                  <input type="text" placeholder="请输入 17 位 VIN 车架号..." className="flex-1 bg-transparent text-white text-sm py-3.5 px-5 outline-none placeholder-gray-500" />
                </div>
                <button className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-colors flex justify-center items-center">极速获取报价</button>
              </div>
            )}
          </div>
          
          <div className={`mt-8 flex items-center space-x-8 text-sm text-gray-400 transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <span className="flex items-center"><ShieldCheck size={18} className="mr-2 text-green-400" /> 259项严苛检测</span>
            <span className="flex items-center"><ShieldCheck size={18} className="mr-2 text-green-400" /> 7天无理由退款</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
