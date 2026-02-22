import React, { useState, useEffect } from 'react';
import { 
  MapPin, ShieldCheck, CheckCircle2, AlertTriangle, 
  ChevronRight, Clock, Calendar, Gauge, FileText, 
  CreditCard, Navigation, Phone, Share2, Heart, Info, ExternalLink
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCarDetail, createOrder } from '../api';
import GlobalHeader from '../components/GlobalHeader';
import AMapContainer from '../components/AMapContainer'; 

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeImg, setActiveImg] = useState(0);
  const [orderStatus, setOrderStatus] = useState('idle');
  const [carData, setCarData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 数据获取逻辑
  useEffect(() => {
    getCarDetail(id)
      .then(res => {
        setCarData(res.data.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("加载详情失败", err);
        setIsLoading(false);
      });
  }, [id]);

  // 2. 锁车逻辑 (后端已经配置了自动读取该车的定金金额)
  const handleLockCar = async () => {
    if (!carData) return;
    setOrderStatus('loading');
    try {
      const res = await createOrder({ skuId: carData.id });
      if (res.data.success) {
        setOrderStatus('success');
      } else {
        setOrderStatus('failed');
      }
    } catch (error) {
      console.error("锁车请求异常", error);
      setOrderStatus('failed');
    }
  };

// 在 CarDetail.jsx 中修改 isLoading 判断
if (isLoading) {
  return (
    <div className="min-h-screen bg-white">
      <GlobalHeader />
      <div className="pt-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          {/* 图片骨架 */}
          <div className="aspect-[16/10] w-full bg-gray-100 animate-pulse rounded-[2rem]"></div>
          {/* 内容骨架 */}
          <div className="h-64 w-full bg-gray-50 animate-pulse rounded-[2rem]"></div>
        </div>
        <div className="lg:col-span-4 h-[500px] bg-gray-100 animate-pulse rounded-[2rem]"></div>
      </div>
    </div>
  );
}

  // 4. 数据解析辅助函数
  const universalParse = (input) => {
    if (!input || input === "null") return [];
    try {
      return typeof input === 'string' ? JSON.parse(input) : input;
    } catch (e) {
      return [];
    }
  };

  const parsedImages = universalParse(carData.images);
  const displayImages = parsedImages.length > 0 ? parsedImages : ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8'];
  
  const rawRisks = universalParse(carData.majorRisks || carData.major_risks);
  const displayRisks = rawRisks.length > 0 ? rawRisks : ['无重大事故', '无火烧痕迹', '无泡水痕迹', '发动机/变速箱无大修'];

  const displayFlaws = universalParse(carData.flaws);

  // 🌟 核心亮点：动态计算该车的专属定金
  const showPriceValue = parseFloat(carData.showPrice || carData.show_price || 0);
  const displayDeposit = carData.depositAmount || carData.deposit_amount || 
    (showPriceValue < 10 ? 500 : (showPriceValue < 30 ? 2000 : 5000));

  // 🌟 提取第三方报告链接
  const thirdPartyReport = carData.thirdPartyReport || carData.third_party_report;

  const currentCar = {
    id: carData.id,
    skuId: carData.vinCode || carData.vin_code || 'VIN-UNKNOWN',
    brand: carData.brand || 'AutoMax',
    spuName: carData.spuName || carData.spu_name || '精选优质车源', 
    tags: ['严选车源', '底盘扎实', '外观精品'],
    price: carData.showPrice || carData.show_price || '0.00',
    newCarPrice: carData.guidePrice || carData.guide_price || (showPriceValue * 1.2).toFixed(2),
    images: displayImages,
    specs: {
      year: carData.firstRegDate || carData.first_reg_date || '2023',
      mileage: carData.mileage || '0.0',
      city: carData.city || '成都市',
      emission: carData.emissionStd || carData.emission_std || '国VI'
    },
    store: {
      name: carData.storeName || carData.store_name || 'AutoMax 旗舰中心',
      address: carData.detailAddress || carData.detail_address || '成都市高新区天府三街',
      phone: carData.contactPhone || carData.contact_phone || '400-888-0001'
    },
    condition: {
      score: carData.carScore || carData.car_score || 100,
      risks: displayRisks,
      issues: displayFlaws
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans selection:bg-blue-100">
      <GlobalHeader />

      <main className="pt-24 pb-24 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* 左侧：图集与详细报告 */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 图片库保持不变... */}
            <div className="space-y-4">
              <div className="aspect-[16/10] w-full bg-gray-200 rounded-3xl overflow-hidden shadow-2xl relative group">
                <img src={currentCar.images[activeImg]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car Main"/>
                <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium">共 {currentCar.images.length} 张图片</div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x px-1 scrollbar-hide">
                {currentCar.images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImg(idx)} className={`snap-start flex-shrink-0 w-28 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeImg === idx ? 'border-blue-600 scale-[1.02]' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={img} className="w-full h-full object-cover" alt="Thumbnail" />
                  </button>
                ))}
              </div>
            </div>

            {/* 透明车况档案 */}
            <section className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 text-green-50 opacity-30 pointer-events-none">
                <ShieldCheck size={200} strokeWidth={1} />
              </div>

              <div className="relative z-10 mb-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                    <ShieldCheck className="text-green-500 mr-3" size={32} /> AutoMax 透明车况档案
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 ml-11">基于 259 项专业检测标准</p>
                </div>
                <div className="flex flex-col items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg text-white ring-4 ring-green-100">
                  <span className="text-3xl font-black">{currentCar.condition.score}</span>
                  <span className="text-[10px] font-medium opacity-80">综合评分</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-10 relative z-10">
                <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100">
                  <h4 className="font-bold text-gray-900 mb-5 flex items-center text-lg"><CheckCircle2 className="text-green-600 mr-2" size={20} /> 核心保障</h4>
                  <ul className="space-y-4">
                    {currentCar.condition.risks.map((item, i) => <li key={i} className="flex items-center font-medium text-gray-700 bg-white p-3 rounded-xl shadow-sm"><CheckCircle2 size={18} className="text-green-500 mr-3 flex-shrink-0" /> {item}</li>)}
                  </ul>
                </div>
                <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                  <h4 className="font-bold text-gray-900 mb-5 flex items-center text-lg"><AlertTriangle className="text-orange-500 mr-2" size={20} /> 瑕疵如实披露</h4>
                  <ul className="space-y-3">
                    {currentCar.condition.issues.length > 0 ? (
                      currentCar.condition.issues.map((issue, i) => (
                        <li key={i} className="flex items-start text-sm bg-white p-3 rounded-xl border border-orange-100 shadow-sm"><span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 mr-2 flex-shrink-0"></span><span><span className="font-bold text-gray-900 mr-1">{issue.part}：</span><span className="text-gray-600">{issue.desc}</span></span></li>
                      ))
                    ) : (
                      <li className="text-sm text-green-700 italic bg-green-100/50 p-4 rounded-xl border border-green-200">✨ 完美车况：全车检测未发现瑕疵纪录</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* 🌟 亮点：第三方报告入口 */}
              {thirdPartyReport && (
                <div className="mt-8 relative z-10 border-t border-gray-100 pt-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="bg-blue-100 p-3 rounded-full mr-4 text-blue-600">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">独立第三方权威检测</h4>
                        <p className="text-xs text-gray-500 mt-1">此车已通过第三方（如查博士）交叉验车，享 90 天全额退车保障。</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open(thirdPartyReport, '_blank')}
                      className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold rounded-xl transition-colors flex justify-center items-center shadow-sm"
                    >
                      查看完整报告 <ExternalLink size={16} className="ml-2" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* 右侧：挂件与控制台 */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-xl border border-gray-100 relative z-10">
                <div className="mb-5">
                  <span className="text-blue-600 font-bold text-xs tracking-widest uppercase mb-2 block">{currentCar.brand} 官方认证</span>
                  <h1 className="text-3xl font-black text-gray-900 leading-tight">{currentCar.spuName}</h1>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {currentCar.tags.map(tag => <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{tag}</span>)}
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium font-mono rounded-full">VIN: {currentCar.skuId.slice(-6)}</span>
                </div>

                <div className="mb-8 pb-8 border-b border-gray-100">
                  <div className="flex items-baseline text-red-600">
                    <span className="text-2xl font-bold mr-1">¥</span>
                    <span className="text-6xl font-black tracking-tighter">{currentCar.price}</span>
                    <span className="text-xl font-bold ml-1 text-gray-900">万</span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg flex items-center">
                    <Info size={14} className="mr-1.5 text-blue-500" />
                    新车约 ¥{currentCar.newCarPrice}万，已省 ¥{(parseFloat(currentCar.newCarPrice) - parseFloat(currentCar.price)).toFixed(1)}万
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-blue-50/50 p-4 rounded-2xl">
                    <p className="text-xs text-blue-400 font-medium mb-1">首次上牌</p>
                    <p className="font-bold text-gray-900">{currentCar.specs.year}</p>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-2xl">
                    <p className="text-xs text-blue-400 font-medium mb-1">表显里程</p>
                    <p className="font-bold text-gray-900">{currentCar.specs.mileage}万公里</p>
                  </div>
                </div>

                {/* 🌟 亮点：预定按钮与阶梯定金透出 */}
                <div className="space-y-4">
                  {orderStatus === 'idle' && (
                    <div className="text-center">
                      <div className="text-xs font-bold text-gray-500 mb-3 bg-gray-50 py-2 rounded-lg border border-gray-100">
                        该车源抢手，预付 <span className="text-red-500 text-sm mx-1">¥{displayDeposit}</span> 意向金即可锁定
                      </div>
                      <button onClick={handleLockCar} className="w-full bg-blue-600 hover:bg-black text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex justify-center items-center">
                        <CreditCard className="mr-3" size={24} /> 立即预定抢位
                      </button>
                    </div>
                  )}
                  {orderStatus === 'loading' && (
                    <button disabled className="w-full bg-gray-200 text-gray-500 font-bold text-lg py-5 rounded-2xl flex justify-center items-center">
                       <Clock className="mr-3 animate-spin" /> 正在锁定库存并生成订单...
                    </button>
                  )}
                  {orderStatus === 'success' && (
                    <div className="w-full bg-green-500 text-white p-5 rounded-2xl text-center shadow-lg shadow-green-200">
                       <CheckCircle2 className="mx-auto mb-1" size={28} />
                       <div className="text-lg font-bold">预定成功！请尽快到店付尾款</div>
                    </div>
                  )}
                  {orderStatus === 'failed' && (
                    <div className="w-full bg-red-50 text-red-600 p-5 rounded-2xl text-center border border-red-100">
                       <AlertTriangle className="mx-auto mb-1" size={28} />
                       <div className="text-sm font-bold">预定失败，下手慢了已被抢订或网络异常</div>
                       <button onClick={() => setOrderStatus('idle')} className="mt-2 text-xs underline">重试</button>
                    </div>
                  )}
                </div>
              </div>

              {/* 门店卡片：集成高德地图 */}
              <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 flex items-center mb-1"><MapPin size={20} className="mr-2 text-blue-600" /> {currentCar.store.name}</h3>
                  <p className="text-xs text-gray-500 mb-6">{currentCar.store.address}</p>
                  
                  <div className="h-48 w-full rounded-2xl overflow-hidden mb-6 relative">
                    <AMapContainer address={currentCar.store.address} city={currentCar.specs.city} />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg z-10 animate-pulse">
                      车辆现停放于此
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl text-xs font-bold border border-gray-100 hover:bg-gray-100 transition-all flex justify-center items-center">
                      <Navigation size={14} className="mr-2"/> 导航到店
                    </button>
                    <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md flex justify-center items-center">
                      <Phone size={14} className="mr-2"/> 联系顾问
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}