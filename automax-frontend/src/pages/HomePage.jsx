import React, { useState, useEffect, useMemo } from 'react';
import HeroSection from '../components/HeroSection';
import useScrollReveal from '../hooks/useScrollReveal'; 
import { getCarList } from '../api';
import { useNavigate } from 'react-router-dom';
import GlobalHeader from '../components/GlobalHeader';

import { 
  MapPin, RefreshCw, 
  BadgeDollarSign
} from 'lucide-react';

// 🌟 性能优化：骨架屏组件，提升加载时的感官速度
const SkeletonCard = () => (
  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="flex justify-between items-center pt-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  </div>
);

const InventorySection = ({ cars, isLoading }) => {
  const [ref, isVisible] = useScrollReveal(0.15);
  const navigate = useNavigate();

  // 🌟 核心性能优化：使用 useMemo 预处理数据
  // 避免在每次滚动触发重绘时重新执行 JSON.parse，大幅降低 CPU 占用
  const processedCars = useMemo(() => {
    if (!Array.isArray(cars)) return [];
    return cars.map(car => {
      let displayImg = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80';
      try {
        if (car.images) {
          const carImages = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
          if (Array.isArray(carImages) && carImages.length > 0) {
            const rawImg = carImages[0];
            // 🌟 核心性能优化：图片尺寸压缩
            // 如果是 Unsplash 图片，强制限制宽度为 600px，画质 80，体积缩减 90% 以上
            displayImg = rawImg.includes('unsplash.com') 
              ? `${rawImg.split('?')[0]}?auto=format&fit=crop&w=600&q=80` 
              : rawImg;
          }
        }
      } catch (e) {
        console.error("图片解析失败", e);
      }
      return { ...car, displayImg };
    });
  }, [cars]);

  return (
    <section ref={ref} className="w-full bg-gray-50 py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
        {/* 头部标题区 */}
        <div className="flex justify-between items-end mb-12">
          <div className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">热门严选好车</h2>
            <p className="text-gray-500 mt-2 text-lg">
              {isLoading ? "正在为您搜罗全国优质车源..." : `为您精选 ${processedCars.length} 台本地好车`}
            </p>
          </div>
        </div>

        {/* 列表渲染区 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // 加载中显示骨架屏
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : processedCars.length > 0 ? (
            processedCars.map((car, index) => {
              const delay = `${(index % 8) * 100}ms`;
              return (
                <div 
                  key={car.id} 
                  onClick={() => navigate(`/car/${car.id}`)}
                  style={{ transitionDelay: delay }}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer border border-gray-100 hover:-translate-y-2 relative transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                >
                  {/* 状态标签 */}
                  <div className={`absolute top-4 left-4 z-10 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full ${car.status === 2 ? 'bg-green-500/80' : 'bg-orange-500/80'}`}>
                    {car.status === 2 ? '在售' : '已锁定'}
                  </div>

                  <div className="absolute top-4 right-4 z-10 bg-white/90 p-1.5 rounded-lg shadow-sm text-[10px] font-bold text-gray-700">
                    {car.brand}
                  </div>

                  {/* 图片区 */}
                  <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                    <img 
                      src={car.displayImg} 
                      alt={car.spuName} 
                      loading="lazy" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                  </div>

                  {/* 核心信息区 */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {car.spuName || "未知车型"} 
                    </h3>
                    
                    <div className="flex items-center text-xs text-gray-500 mb-4 space-x-2">
                      <span>{car.mileage}万公里</span>
                      <span>•</span>
                      <span>{car.gearbox || "自动挡"}</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex items-baseline text-red-600">
                        <span className="text-xs font-bold mr-0.5">¥</span>
                        <span className="text-2xl font-black italic">{car.showPrice}</span>
                        <span className="text-xs font-bold ml-0.5">万</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                      <div className="flex items-center">
                        <MapPin size={12} className="mr-1 text-blue-500" />
                        <span>{car.storeName || "默认门店"}</span>
                      </div>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{car.city || "成都市"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400">正在努力加载精选车源...</div>
          )}
        </div>
      </div>
    </section>
  );
};

const FeatureSection = () => {
  const [ref, isVisible] = useScrollReveal(0.3);

  return (
    <section ref={ref} className="w-full bg-blue-900 text-white relative flex items-center py-28 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-800 transform skew-x-12 translate-x-32 hidden lg:block"></div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10 flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 space-y-12">
          <div className={`transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100 delay-100' : '-translate-x-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">打破行业潜规则<br/>重塑买车信任</h2>
            <p className="text-blue-200 text-lg leading-relaxed">在 AutoMax，我们拒绝讨价还价的套路，拒绝隐瞒车况。</p>
          </div>
          <div className="space-y-8">
            <div className={`flex items-start transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-yellow-400 text-blue-900 p-3 rounded-2xl mr-5"><BadgeDollarSign size={32} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">透明一口价</h3>
                <p className="text-blue-200 text-sm">你看到的价格，就是最终的提车价格。</p>
              </div>
            </div>
            <div className={`flex items-start transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100 delay-500' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-green-400 text-blue-900 p-3 rounded-2xl mr-5"><RefreshCw size={32} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">7天无理由退车</h3>
                <p className="text-blue-200 text-sm">买车像网购一样安心。</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2 hidden lg:block">
          <img 
            src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80" 
            alt="Quality Check" 
            className={`rounded-3xl shadow-2xl border-4 border-white/10 transition-all duration-1000 ease-out transform ${isVisible ? 'translate-x-0 rotate-3 opacity-100 delay-300' : 'translate-x-20 rotate-0 opacity-0'}`}
          />
        </div>
      </div>
    </section>
  );
};

const GlobalFooter = () => (
  <footer className="w-full bg-black text-gray-500 py-12 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm flex flex-col items-center">
      <div className="font-bold text-xl text-gray-400 mb-4 tracking-tighter">AutoMax</div>
      <p>© 2026 AutoMax 二手车交易平台. 毕业设计演示项目.</p>
    </div>
  </footer>
);

export default function HomePage() {
  const [carList, setCarList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCarList()
      .then(res => {
        if (res.data && res.data.success) {
          setCarList(res.data.data || []); 
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("首页数据加载失败:", err);
        setCarList([]); 
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen w-full font-sans text-gray-900 bg-black overflow-x-hidden">
      <GlobalHeader transparentAtTop={true}/>
      <HeroSection />
      {/* 🌟 只有不加载时才显示 FeatureSection，减少首屏渲染压力 */}
      <InventorySection cars={carList} isLoading={loading} />
      {!loading && <FeatureSection />}
      <GlobalFooter />
    </div>
  );
}