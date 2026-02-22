import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Plus, X, Map as MapIcon, Navigation, Save } from 'lucide-react';
import { getStoreList, saveStore, deleteStore, getCandidateManagers, bindStoreManager } from '../../api';
import AMapLoader from '@amap/amap-jsapi-loader'; // 需安装：npm i @amap/amap-jsapi-loader
import { toast } from 'react-toastify'; 


export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({ storeName: '', address: '', lng: '', lat: '', phone: '' });
  const [candidates, setCandidates] = useState([]);
  useEffect(() => { fetchStores(); }, []);

  useEffect(() => {
  const fetchUsers = async () => {
    const res = await getCandidateManagers();
    if (res.data.success) setCandidates(res.data.data);
  };
  fetchUsers();
}, []);

const handleSetManager = async (storeId, userId) => {
  await bindStoreManager({ storeId, userId });
  toast.success("店长任命成功！");
  fetchStores();
};
  const fetchStores = async () => {
    const res = await getStoreList();
    if (res.data.success) setStores(res.data.data);
  };

  // 🌟 核心：打开抽屉并初始化地图
  const openDrawer = (store = null) => {
    setEditingStore(store);
    setFormData(store || { storeName: '', address: '', lng: '', lat: '', phone: '' });
    setIsDrawerOpen(true);
    initMap(store);
  };

const initMap = (existingStore) => {
  AMapLoader.load({
    key: "你的高德Key",
    version: "2.0",
    plugins: ['AMap.Geocoder', 'AMap.Marker'] // 🌟 必须加载 Geocoder 插件
  }).then((AMap) => {
    const map = new AMap.Map("map-container", {
      zoom: 13,
      center: existingStore ? [existingStore.longitude, existingStore.latitude] : [104.06, 30.57]
    });

    // 创建逆地理编码实例
    const geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: 'all'
    });

    let marker = existingStore ? new AMap.Marker({ position: [existingStore.longitude, existingStore.latitude], map }) : null;

    // 🌟 监听地图点击：选址并取词
    map.on('click', (e) => {
      const { lng, lat } = e.lnglat;
      
      // 更新或新建标记
      if (marker) marker.setMap(null);
      marker = new AMap.Marker({ position: [lng, lat], map });

      // 调用高德接口：经纬度 -> 文字地址
      geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          const address = result.regeocode.formattedAddress;
          
          // 自动填充表单数据
          setFormData(prev => ({
            ...prev,
            longitude: lng,
            latitude: lat,
            address: address // 🌟 这是系统自动抓取的地址
          }));
        }
      });
    });
  });
};

  const handleSubmit = async () => {
    await saveStore(formData);
    setIsDrawerOpen(false);
    fetchStores();
  };

  return (
    <div className="space-y-6 relative overflow-hidden h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900">门店资产管理</h1>
        <button onClick={() => openDrawer()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={20} className="mr-2" /> 新增连锁门店
        </button>
      </div>

      {/* 门店网格列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <div key={store.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><MapPin size={24}/></div>
              <button onClick={() => openDrawer(store)} className="text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">编辑档案</button>
            </div>
            <h3 className="text-lg font-black text-gray-900">{store.storeName}</h3>
            <p className="text-xs text-gray-400 mt-2 flex items-center"><Navigation size={12} className="mr-1"/> {store.address}</p>
            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800 flex items-center"><Phone size={14} className="mr-2 text-gray-400"/> {store.phone}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 🌟 核心：右侧抽屉 (Drawer) */}
      <div className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-500 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-gray-100 flex flex-col`}>
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-black">{editingStore ? '编辑门店' : '录入新门店'}</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">地图标注 (点击选址)</label>
            <div id="map-container" className="h-64 rounded-3xl border border-gray-100 overflow-hidden shadow-inner"></div>
            <p className="text-[10px] text-blue-500 mt-2 font-bold italic">已经在地图中获取坐标: {formData.lng}, {formData.lat}</p>
          </div>
            {editingStore && ( // 只有编辑已有门店时才显示
            <div className="mt-4 p-4 bg-blue-50/50 rounded-3xl border border-blue-100">
                <label className="block text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest">
                任命此店店长
                </label>
                <select 
                className="w-full text-xs p-3 bg-white rounded-2xl outline-none border-none shadow-sm"
                onChange={(e) => handleSetManager(editingStore.id, e.target.value)} // 🌟 修正：使用 editingStore.id
                defaultValue=""
                >
                <option value="" disabled>选择一名员工提拔为店长...</option>
                {candidates.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.phone || '无电话'})</option>
                ))}
                </select>
            </div>
            )}
          <div className="space-y-4">
            <input placeholder="门店名称" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} />
            <input placeholder="自动获取的地址" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none border border-blue-100 text-sm" value={formData.address} readOnly />
            <input placeholder="补充详细地址 (如: 3楼A座102室)" className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none shadow-sm" onChange={e => setFormData({...formData, detailAddress: e.target.value})} />
            <input placeholder="联系电话" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
        </div>

        <div className="p-8 border-t border-gray-50">
          <button onClick={handleSubmit} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-xl hover:bg-black transition-all">
            <Save size={20}/> <span>保存门店档案</span>
          </button>
        </div>
      </div>

      {/* 遮罩层 */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>}
    </div>
  );
}