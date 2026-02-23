import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteAdminCar, getAdminCarList, getStoreList } from '../../api';
import { toast } from 'react-toastify';


export default function CarList() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [cars, setCars] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeFilter, setStoreFilter] = useState('');

  const fetchCars = async () => {
    try {
      const params = role === 'ADMIN' && storeFilter ? { storeId: storeFilter } : undefined;
      const res = await getAdminCarList(params);
      if (res.data && res.data.success) {
        setCars(res.data.data || []);
      }
    } catch (error) {
      console.error("获取车辆列表失败:", error);
      setCars([]);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [storeFilter]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    getStoreList().then((res) => {
      if (res.data?.success) {
        setStores(res.data.data || []);
      }
    });
  }, [role]);

  const handleDelete = async (car) => {
    const ok = window.confirm(`确认删除车辆【${car.title || car.vinCode}】吗？`);
    if (!ok) return;
    try {
      const res = await deleteAdminCar(car.id);
      if (res.data?.success) {
        toast.success(res.data.msg || '删除成功');
        fetchCars();
      } else {
        toast.error(res.data?.msg || '删除失败');
      }
    } catch (e) {
      toast.error('删除失败，请稍后重试');
    }
  };
      const renderAgingTag = (createTime) => {
          if (!createTime) {
            return <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">未知</span>;
          }
          
          // 计算天数差
          const days = Math.floor((new Date() - new Date(createTime)) / (1000 * 60 * 60 * 24));
          
          if (days > 60) {
            return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold border border-red-200 shadow-sm">{days} 天 (重度滞销)</span>;
          } else if (days > 30) {
            return <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold border border-orange-200">{days} 天 (超期预警)</span>;
          } else {
            return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">{days} 天 (健康)</span>;
          }
        };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">车辆库存管理</h1>
        <div className="flex items-center gap-3">
          {role === 'ADMIN' && (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700"
            >
              <option value="">全部门店</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.storeName}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => navigate('/admin/add', { state: { preferredStoreId: storeFilter || '' } })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center shadow-lg"
          >
            <Plus size={20} className="mr-2"/> 新增上架车辆
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">车辆信息</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">操作</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                <Clock size={14} className="mr-1"/> 库龄预警 (BI)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {/* 🌟 修复点 3：加上安全判断，确保是数组才进行 map */}
            {Array.isArray(cars) && cars.length > 0 ? (
              cars.map(car => (
                <tr key={car.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-16 bg-gray-100 rounded-lg overflow-hidden mr-4">
                        {/* 修正：JSON 解析图片 */}
                        <img 
                          src={ car.images ? (typeof car.images === 'string' ? JSON.parse(car.images)[0] : car.images[0]) : '' } 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{car.title || car.spuName || '未命名车辆'}</p>
                        <p className="text-xs text-gray-400 font-mono">{car.vinCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-red-600">¥ {car.showPrice} 万</p>
                    <p className="text-xs text-gray-400">{car.mileage} 万公里</p>
                  </td>
                  <td className="px-6 py-4">
                    {renderAgingTag(car.createTime)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => navigate(`/admin/edit/${car.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={18}/></button>
                    <button onClick={() => handleDelete(car)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">
                  暂无车辆数据，请点击右上角新增
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
