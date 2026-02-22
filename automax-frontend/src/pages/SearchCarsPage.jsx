import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, SlidersHorizontal, MapPin } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { getCarList } from '../api';

function parsePriceRange(price) {
  if (!price) return { min: 0, max: Number.MAX_SAFE_INTEGER };
  const [min, max] = price.split('-').map(Number);
  return { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER };
}

export default function SearchCarsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const brand = params.get('brand') || '';
  const price = params.get('price') || '';
  const priceRange = parsePriceRange(price);

  useEffect(() => {
    setLoading(true);
    getCarList()
      .then((res) => {
        if (res.data?.success) setCars(res.data.data || []);
        else setCars([]);
      })
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, [location.search]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return cars.filter((car) => {
      const carBrand = String(car.brand || '');
      const carPrice = Number(car.showPrice || 0);
      const matchBrand = !brand || carBrand === brand;
      const matchPrice = carPrice >= priceRange.min && carPrice <= priceRange.max;
      const matchKeyword = !key || [car.spuName, car.title, car.brand, car.series].join(' ').toLowerCase().includes(key);
      return matchBrand && matchPrice && matchKeyword;
    });
  }, [cars, q, brand, priceRange.min, priceRange.max]);

  const getCover = (car) => {
    try {
      const imgs = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
      if (Array.isArray(imgs) && imgs[0]) return imgs[0];
    } catch (_) {}
    return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader transparentAtTop={false} />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-14">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <button onClick={() => navigate('/')} className="inline-flex items-center px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:border-gray-300">
            <ArrowLeft size={16} className="mr-1" /> 返回首页
          </button>
          <div className="text-sm text-gray-500 flex items-center">
            <SlidersHorizontal size={14} className="mr-1" /> 当前条件：{brand || '不限品牌'} / {price || '不限价格'} / {q || '无关键词'}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-black text-gray-900 flex items-center"><Search size={20} className="mr-2 text-blue-500" /> 搜索结果</h1>
          <p className="text-gray-500 text-sm mt-1">共找到 <span className="font-bold text-gray-900">{filtered.length}</span> 台符合条件的车辆</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">正在加载搜索结果...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center text-gray-400">暂无符合条件车辆，建议调整品牌或价格区间</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((car) => (
              <div key={car.id} onClick={() => navigate(`/car/${car.id}`)} className="bg-white rounded-3xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img src={getCover(car)} alt={car.spuName} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{car.spuName || car.title || '未知车型'}</h3>
                  <p className="text-xs text-gray-500 mt-1">{car.mileage || '-'}万公里 · {car.brand || '未知品牌'}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-red-600 font-black">¥{car.showPrice || '-'}万</div>
                    <div className="text-[11px] text-gray-400 flex items-center"><MapPin size={11} className="mr-1" />{car.city || '未知城市'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}