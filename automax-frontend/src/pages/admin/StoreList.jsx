import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 🌟 引入 Portal
import { MapPin, Phone, Plus, X, Navigation, Save, UserCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoreList, saveStore, getCandidateManagers, bindStoreManager } from '../../api';
import AMapLoader from '@amap/amap-jsapi-loader'; 
import { toast } from 'react-toastify'; 

export default function StoreList() {
  const navigate = useNavigate();
  const amapKey = import.meta.env.VITE_AMAP_KEY?.trim();
  const [stores, setStores] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({ storeName: '', address: '', lng: '', lat: '', phone: '' });
  const [candidates, setCandidates] = useState([]);

  useEffect(() => { 
    fetchStores(); 
    fetchUsers(); 
  }, []);

  const fetchUsers = async () => {
    const res = await getCandidateManagers();
    if (res.data.success) setCandidates(res.data.data || []);
  };

  const fetchStores = async () => {
    const res = await getStoreList();
    if (res.data.success) setStores(res.data.data);
  };

  const handleSetManager = async (storeId, userId) => {
    await bindStoreManager({ storeId, userId });
    toast.success("店长任命成功！");
    fetchStores(); 
  };

  const openDrawer = (store = null) => {
    setEditingStore(store);
    const safe = store || {};
    setFormData({
      id: safe.id,
      storeName: safe.storeName || '',
      address: safe.address || '',
      detailAddress: safe.detailAddress || '',
      lng: safe.lng ?? '',
      lat: safe.lat ?? '',
      phone: safe.phone || '',
    });
    setIsDrawerOpen(true);
    initMap(store);
  };

  const initMap = (existingStore) => {
    if (!amapKey) {
      toast.warn("未配置 VITE_AMAP_KEY，地图功能已禁用");
      return;
    }
    AMapLoader.load({
      key: amapKey,
      version: "2.0",
      plugins: ['AMap.Geocoder', 'AMap.Marker', 'AMap.CitySearch'] 
    }).then((AMap) => {
      const map = new AMap.Map("map-container", {
        zoom: 13,
        center: existingStore && existingStore.lng ? [existingStore.lng, existingStore.lat] : [104.06, 30.57]
      });

      const geocoder = new AMap.Geocoder({ radius: 1000, extensions: 'all' });

      let marker = existingStore && existingStore.lng ? 
        new AMap.Marker({ position: [existingStore.lng, existingStore.lat], map }) : null;

      // 智能定位：新增门店时自动定位到操作者所在城市
      if (!existingStore || !existingStore.lng) {
        const citySearch = new AMap.CitySearch();
        citySearch.getLocalCity((status, result) => {
          if (status === 'complete' && result.info === 'OK') {
            map.setCity(result.city);
          }
        });
      }

      map.on('click', (e) => {
        const { lng, lat } = e.lnglat;
        
        if (marker) marker.setMap(null);
        marker = new AMap.Marker({ position: [lng, lat], map });

        geocoder.getAddress([lng, lat], (status, result) => {
          if (status === 'complete' && result.regeocode) {
            const address = result.regeocode.formattedAddress;
            setFormData(prev => ({
              ...prev,
              lng: lng, 
              lat: lat, 
              address: address 
            }));
          }
        });
      });
    }).catch(() => {
      toast.error("地图加载失败，请检查高德 Key 或域名白名单配置");
    });
  };

  const handleSubmit = async () => {
    if (!formData.storeName) return toast.error("请输入门店名称");
    if (!formData.lng || !formData.lat) return toast.error("请在地图上点击选择位置");
    
    await saveStore(formData);
    toast.success(editingStore ? "门店档案已更新" : "新门店录入成功");
    setIsDrawerOpen(false);
    fetchStores();
  };

  return (
    // 🌟 修复：去掉 relative, overflow-hidden, h-full，让内容自然延伸，不会被截断
    <div className="space-y-6 pb-10">
      
      {/* 头部标题区 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900">门店资产管理</h1>
        <button onClick={() => openDrawer()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={20} className="mr-2" /> 新增连锁门店
        </button>
      </div>

      {/* 门店网格列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <div key={store.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
            
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><MapPin size={24}/></div>
                <button onClick={() => openDrawer(store)} className="text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">编辑 / 任命</button>
              </div>
              <h3 className="text-lg font-black text-gray-900">{store.storeName}</h3>
              <p className="text-xs text-gray-400 mt-2 flex items-start leading-relaxed h-8 line-clamp-2">
                <Navigation size={12} className="mr-1 mt-0.5 flex-shrink-0"/> {store.address} {store.detailAddress || ''}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col space-y-3">
              <div className="flex justify-between items-center bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                <span className="text-xs font-bold text-orange-600 flex items-center">
                  <Star size={14} className="mr-1.5" /> 
                  店长: {store.managerName || '暂未任命'}
                </span>
                {store.managerPhone && store.managerPhone !== '-' && (
                  <span className="text-[10px] text-orange-400 font-medium">{store.managerPhone}</span>
                )}
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-gray-800 flex items-center">
                  <Phone size={14} className="mr-2 text-gray-400"/> {store.phone || '无联系方式'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🌟 核心修复：使用 createPortal 把抽屉传送到 body 根节点，绝不被遮挡 */}
      {createPortal(
        <div className={`fixed inset-0 z-[9999] ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          
          {/* 半透明背景遮罩 */}
          <div 
            className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          
          {/* 抽屉主体 */}
          <div className={`absolute inset-y-0 right-0 w-[500px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col border-l border-gray-100 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <h2 className="text-xl font-black text-gray-900">{editingStore ? '编辑门店' : '录入新门店'}</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">地图标注 (点击选址)</label>
                <div id="map-container" className="h-64 rounded-3xl border border-gray-100 overflow-hidden shadow-inner"></div>
                <p className="text-[10px] text-blue-500 mt-2 font-bold italic">
                  当前坐标: {formData.lng || '未获取'}, {formData.lat || '未获取'}
                </p>
              </div>
              
              {editingStore && ( 
                <div className="mt-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                  <label className="block text-[10px] font-black text-blue-500 mb-3 uppercase tracking-widest flex items-center">
                    <UserCircle size={14} className="mr-1" /> 人事任命 (自动顶替原店长)
                  </label>
                  <select 
                    className="w-full text-sm font-medium p-3.5 bg-white text-gray-700 rounded-2xl outline-none border border-blue-200 shadow-sm focus:ring-2 ring-blue-500/20 transition-all cursor-pointer"
                    onChange={(e) => handleSetManager(editingStore.id, e.target.value)}
                    defaultValue=""
                    disabled={candidates.length === 0}
                  >
                    <option value="" disabled>下拉选择员工提拔为新店长...</option>
                    {candidates.map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({u.phone || '无电话'})</option>
                    ))}
                  </select>
                  {candidates.length === 0 && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      当前没有可提拔员工（STAFF）。请先到
                      <button
                        type="button"
                        className="mx-1 font-bold underline hover:text-amber-900"
                        onClick={() => navigate('/admin/users')}
                      >
                        员工管理
                      </button>
                      新增或将人员角色调整为 STAFF。
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <input placeholder="门店名称" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 font-medium text-gray-900" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} />
                <input placeholder="自动获取的地址" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none border border-blue-100 text-sm text-gray-500 cursor-not-allowed" value={formData.address} readOnly />
                <input placeholder="补充详细地址 (如: 3楼A座102室)" className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none shadow-sm focus:ring-2 ring-blue-500/20" value={formData.detailAddress || ''} onChange={e => setFormData({...formData, detailAddress: e.target.value})} />
                <input placeholder="联系电话" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 bg-white">
              <button onClick={handleSubmit} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-xl hover:bg-black transition-all">
                <Save size={20}/> <span>保存门店档案</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
