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
  const [allCities, setAllCities] = useState([]);
  const [cityKeyword, setCityKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const brand = params.get('brand') || '';
  const price = params.get('price') || '';
  const city = params.get('city') || '';
  const priceRange = parsePriceRange(price);

  useEffect(() => {
    setLoading(true);
    getCarList({
      brand: brand || undefined,
      city: city || undefined,
      minPrice: Number.isFinite(priceRange.min) && priceRange.min > 0 ? priceRange.min : undefined,
      maxPrice: Number.isFinite(priceRange.max) && priceRange.max < Number.MAX_SAFE_INTEGER ? priceRange.max : undefined
    })
      .then((res) => {
        if (res.data?.success) setCars(res.data.data || []);
        else setCars([]);
      })
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, [location.search, brand, city, priceRange.min, priceRange.max]);

  useEffect(() => {
    getCarList()
      .then((res) => {
        if (!res.data?.success) return;
        const list = Array.from(new Set((res.data.data || []).map((car) => car.city).filter(Boolean)));
        list.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN'));
        setAllCities(list);
      })
      .catch(() => setAllCities([]));
  }, []);

  useEffect(() => {
    if (city) localStorage.setItem('preferred_city', city);
  }, [city]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return cars.filter((car) => {
      const carBrand = String(car.brand || '');
      const carCity = String(car.city || '');
      const carPrice = Number(car.showPrice || 0);
      const matchBrand = !brand || carBrand === brand;
      const matchCity = !city || carCity === city;
      const matchPrice = carPrice >= priceRange.min && carPrice <= priceRange.max;
      const matchKeyword = !key || [car.spuName, car.title, car.brand, car.series].join(' ').toLowerCase().includes(key);
      return matchBrand && matchCity && matchPrice && matchKeyword;
    });
  }, [cars, q, brand, city, priceRange.min, priceRange.max]);

  const cityOptions = useMemo(() => {
    const key = cityKeyword.trim();
    if (!key) return allCities.slice(0, 40);
    return allCities.filter((c) => String(c).includes(key)).slice(0, 40);
  }, [allCities, cityKeyword]);
  const hotCities = ['成都市', '重庆市', '西安市', '北京市', '上海市', '广州市', '深圳市', '杭州市'];

  const updateQuery = (next) => {
    const query = new URLSearchParams(location.search);
    Object.entries(next).forEach(([key, value]) => {
      if (value) query.set(key, value);
      else query.delete(key);
    });
    navigate(`/search-cars?${query.toString()}`);
  };
  const pickCity = (value) => {
    updateQuery({ city: value || undefined });
    if (value) localStorage.setItem('preferred_city', value);
  };

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
            <SlidersHorizontal size={14} className="mr-1" /> 当前条件：{brand || '不限品牌'} / {city || '不限城市'} / {price || '不限价格'} / {q || '无关键词'}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-black text-gray-900 flex items-center"><Search size={20} className="mr-2 text-blue-500" /> 搜索结果</h1>
          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">城市筛选</span>
              <button
                type="button"
                onClick={() => pickCity('')}
                className={`px-3 py-1 text-xs rounded-full border ${!city ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                全部城市
              </button>
              {hotCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickCity(c)}
                  className={`px-3 py-1 text-xs rounded-full border ${city === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <input
                value={cityKeyword}
                onChange={(e) => setCityKeyword(e.target.value)}
                placeholder="输入城市名快速筛选，例如：成都、深圳..."
                className="w-full max-w-md px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-400"
              />
            </div>
            <div className="mt-3 max-h-36 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2 pr-1">
              {cityOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickCity(c)}
                  className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${city === c ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                >
                  {c}
                </button>
              ))}
              {!cityOptions.length && <div className="text-xs text-gray-400 py-2">没有匹配城市</div>}
            </div>
          </div>
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
