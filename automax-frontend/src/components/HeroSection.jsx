import React, { useState } from 'react';
import { Search, CarFront, Banknote, ShieldCheck, Zap, ChevronDown } from 'lucide-react'; 
import useScrollReveal from '../hooks/useScrollReveal';

const HeroSection = () => {
  const [ref, isVisible] = useScrollReveal(0.2);
  const [activeTab, setActiveTab] = useState('buy'); 
  
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
            isVisible 
              ? 'translate-x-0 scale-100 blur-0 opacity-100' 
              : 'translate-x-[20%] scale-110 blur-xl opacity-0'
          }`}
          // 这里的关键在于：
          // 1. translate-x-[20%] 让车初始位置在右侧屏幕外
          // 2. scale-110 配合位移产生一种冲刺感
          // 3. duration-[1500ms] 确保“驶入”过程优雅不突兀
        />
        
        {/* 精准衔接遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505] via-[25%] to-transparent to-[55%]"></div>
        
        {/* 底部压深 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent via-[15%] to-transparent"></div>
        {/* 顶部防护 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent via-[10%] to-transparent h-40"></div>
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
            <div className={`transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              买卖二手车
            </div>
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
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-black/60 transition">
                    <span className="text-sm text-gray-300">选择品牌</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  <div className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-black/60 transition">
                    <span className="text-sm text-gray-300">价格区间</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </div>
                <div className="flex bg-black/40 rounded-xl border border-white/10 overflow-hidden focus-within:border-yellow-400/50 transition-colors">
                  <div className="flex items-center pl-5 pr-2">
                    <Search size={18} className="text-gray-500" />
                  </div>
                  <input type="text" placeholder="直接搜索如: 思域 2022款" className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-gray-500" />
                  <button className="bg-yellow-400 text-black px-7 font-bold hover:bg-yellow-300 transition-colors">找车</button>
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
            <span className="flex items-center"><ShieldCheck size={18} className="mr-2 text-green-400"/> 259项严苛检测</span>
            <span className="flex items-center"><ShieldCheck size={18} className="mr-2 text-green-400"/> 7天无理由退款</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;