import React, { useState } from 'react';
import { submitSellLead } from '../api';
// 引入漂亮的图标
import { MapPin, Car, Gauge, CircleDollarSign, Phone, CheckCircle2, ShieldCheck, Zap, Clock } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader'; // 引入Header确保页面完整

const SellCar = () => {
  // --- 原有的逻辑保持不变 ---
  const [formData, setFormData] = useState({
    city: '',
    intentionModel: '',
    mileage: '',
    expectedPrice: '',
    userPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. 获取手机号，并自动去掉前后可能存在的空格
    const phone = formData.userPhone ? formData.userPhone.trim() : '';

    // 2. 打印出来看看我们实际拿到的是什么（方便在浏览器 F12 控制台排错）
    console.log("准备提交的手机号是: ", phone, " 长度: ", phone.length);

    // 3. 校验逻辑 (1开头，第二位是3-9，后面9位数字，总共11位)
    if (!phone.match(/^1[3-9]\d{9}$/)) {
      setMessage({ type: 'error', content: '请填写正确的11位手机号码' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', content: '' });
    
    // ... 后面调用后端的代码保持不变
    try {
      // 发送请求前，把去过空格的手机号塞回去
      const submitData = { ...formData, userPhone: phone };
      const res = await submitSellLead(submitData);
      
      // ...
      if (res.data.code === 200) {
          setMessage({ type: 'success', content: '✅ 提交成功！评估专员将在2小时内联系您。' });
          setFormData({ city: '', intentionModel: '', mileage: '', expectedPrice: '', userPhone: '' });
      } else {
          setMessage({ type: 'error', content: `❌ 提交失败: ${res.data.msg}` });
      }
    } catch (error) {
      setMessage({ type: 'error', content: '❌ 系统繁忙，请稍后再试' });
    } finally {
      setLoading(false);
    }
  };
  // --- 逻辑结束 ---

  // 定义通用的输入框样式类名
  const inputWrapperClass = "relative flex items-center";
  const inputIconClass = "absolute left-5 text-gray-400 pointer-events-none";
  const inputClass = "w-full pl-14 pr-4 py-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-yellow-400/50 focus:bg-white transition-all outline-none font-medium text-gray-700 placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* 1. 顶部 Header (透明模式) */}
      <GlobalHeader transparentAtTop={true} />

      {/* 2. 背景图片层 & 遮罩 */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600793575654-910699b5e4d4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Luxury Car Background" 
          className="w-full h-full object-cover object-center opacity-40 scale-105 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-gray-900/30" />
      </div>

      {/* 3. 主要内容区域 (左右布局) */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          
          {/* 左侧：价值主张文案 */}
          <div className="text-white space-y-8 animate-in slide-in-from-left duration-700">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-tight">
              高价卖车，<br/>
              <span className="text-yellow-400">快人一步。</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-lg font-medium">
              AutoMax 智能估价系统，汇集全国买家出价。
              <span className="block mt-2 text-white">最快当天成交，车款即时到账。</span>
            </p>
            
            {/* 信任背书图标 */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center space-x-3 group">
                <div className="bg-yellow-400/10 p-3 rounded-xl group-hover:bg-yellow-400/20 transition-colors">
                  <ShieldCheck className="text-yellow-400" size={28} />
                </div>
                <div>
                   <h4 className="font-bold text-lg">官方担保</h4>
                   <p className="text-sm text-gray-400">交易全程监管</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <Zap className="text-blue-400" size={28} />
                </div>
                 <div>
                   <h4 className="font-bold text-lg">极速成交</h4>
                   <p className="text-sm text-gray-400">平均24h售出</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="bg-green-500/10 p-3 rounded-xl group-hover:bg-green-500/20 transition-colors">
                   <Clock className="text-green-400" size={28} />
                </div>
                 <div>
                   <h4 className="font-bold text-lg">上门服务</h4>
                   <p className="text-sm text-gray-400">足不出户卖车</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：悬浮表单卡片 */}
          <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-black/30 animate-in slide-in-from-bottom delay-200 duration-700">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              免费获取爱车估价
            </h2>
            <p className="text-gray-500 mb-8 font-medium">填写基本信息，专员将在 2 小时内联系您</p>

            {/* 消息提示条 */}
            {message.content && (
              <div className={`p-4 mb-6 rounded-2xl flex items-center space-x-3 font-bold animate-in fade-in ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                 {message.type === 'success' && <CheckCircle2 size={20}/>}
                 <span>{message.content}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className={inputWrapperClass}>
                <MapPin className={inputIconClass} size={20} />
                <input type="text" name="city" className={inputClass} placeholder="所在城市 (例如: 成都市)" value={formData.city} onChange={handleChange} required />
              </div>

              <div className={inputWrapperClass}>
                <Car className={inputIconClass} size={20} />
                <input type="text" name="intentionModel" className={inputClass} placeholder="品牌型号 (例如: 2021款 本田思域)" value={formData.intentionModel} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className={inputWrapperClass}>
                  <Gauge className={inputIconClass} size={20} />
                  <input type="number" name="mileage" className={inputClass} placeholder="行驶里程 (万公里)" value={formData.mileage} onChange={handleChange} step="0.01" />
                </div>
                <div className={inputWrapperClass}>
                  <CircleDollarSign className={inputIconClass} size={20} />
                  <input type="number" name="expectedPrice" className={inputClass} placeholder="期望售价 (万元)" value={formData.expectedPrice} onChange={handleChange} step="0.01" />
                </div>
              </div>

              <div className={inputWrapperClass}>
                <Phone className={inputIconClass} size={20} />
                <input type="tel" name="userPhone" className={inputClass} placeholder="您的手机号码 (必填)" value={formData.userPhone} onChange={handleChange} required />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 mt-4 bg-gradient-to-r from-gray-900 to-black hover:from-yellow-500 hover:to-yellow-600 text-white rounded-2xl font-black text-xl tracking-wide transition-all shadow-xl shadow-gray-200/50 hover:shadow-yellow-400/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>正在提交评估...</span>
                  </>
                ) : (
                  <>
                    <span>立即查看估价</span>
                    <Zap size={20} className="animate-pulse"/>
                  </>
                )}
              </button>
               <p className="text-center text-xs text-gray-400 font-medium mt-4">
                  点击提交即代表您同意 AutoMax 《用户隐私协议》
               </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellCar;