import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, ChevronRight, FileText, CreditCard } from 'lucide-react';
import { getAdminOrderList, getStoreList, updateOrderStatus } from '../../api';

export default function OrderList() {
  const role = localStorage.getItem('role');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [storeFilter, setStoreFilter] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = role === 'ADMIN' && storeFilter ? { storeId: storeFilter } : undefined;
      const res = await getAdminOrderList(params);
      if (res.data && res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error("加载订单失败", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 15000);
    const onNotice = () => fetchOrders();
    window.addEventListener('admin:notice', onNotice);
    return () => {
      clearInterval(timer);
      window.removeEventListener('admin:notice', onNotice);
    };
  }, [storeFilter]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    getStoreList().then((res) => {
      if (res.data?.success) {
        setStores(res.data.data || []);
      }
    });
  }, [role]);

  const handleStatusChange = async (orderId, newStatus, actionName) => {
    const isConfirm = window.confirm(`确定要执行【${actionName}】操作吗？\n注意：取消或退款操作将自动释放该车辆库存！`);
    if (!isConfirm) return;

    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.data && res.data.success) {
        alert(`${actionName} 成功！`);
        fetchOrders(); 
      }
    } catch (err) {
      alert("操作失败，请重试");
    }
  };

  const getStatusUI = (status) => {
    switch (status) {
      case 1: return { text: '已付意向金 (锁车)', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock size={14} className="mr-1" /> };
      case 2: return { text: '线下尾款已结', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <CreditCard size={14} className="mr-1" /> };
      case 3: return { text: '车管所过户中', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <FileText size={14} className="mr-1" /> };
      case 4: return { text: '交易闭环完成', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={14} className="mr-1" /> };
      case 5: return { text: '超时自动取消', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <XCircle size={14} className="mr-1" /> };
      case 6: return { text: '已退款 (释放库存)', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} className="mr-1" /> };
      default: return { text: '未知状态', color: 'bg-gray-100 text-gray-500', icon: null };
    }
  };

  const formatCnDateTime = (value) => {
    if (!value) return '未预约';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}年${m}月${d}日 ${hh}:${mm}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">交易订单中心</h1>
          <p className="text-sm text-gray-500 mt-1">处理 O2O 线下核销、过户状态扭转与库存释放</p>
        </div>
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
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">订单流水号 / 时间</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">关联车辆 (SKU)</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">预约到店</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">金额</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">当前状态</th>
              <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">流转操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan="6" className="text-center py-10 text-gray-400">正在同步订单数据...</td></tr>
            ) : orders.length > 0 ? (
              orders.map(order => {
                const ui = getStatusUI(order.status);
                const orderNo = order.displayOrderNo || order.orderNo || `AMX-${String(order.id || '').padStart(6, '0')}`;
                return (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-mono text-sm font-bold text-gray-900">{orderNo}</p>
                      <p className="text-xs text-gray-400 mt-1">{order.createTime || '刚刚'}</p>
                    </td>
                    <td className="px-6 py-5">
                    <p className="font-bold text-sm text-gray-900">车辆 ID: {order.skuId}</p>
                    {/* 🌟 修复点：添加了 onClick 事件，点击后在新标签页打开这辆车的详情 */}
                    <button 
                    onClick={() => window.open(`/admin/edit/${order.skuId}`, '_blank')}
                    className="text-xs text-blue-500 font-medium mt-1 flex items-center hover:underline"
                    >
                    进入后台档案室 <ChevronRight size={12} />
                    </button>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-gray-700 font-semibold">{formatCnDateTime(order.appointmentTime)}</p>
                      {order.appointmentRemark && (
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">备注：{order.appointmentRemark}</p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {/* 🌟 修复点：将 amount 改为 payAmount */}
                      <p className="text-sm font-bold text-red-600">¥ {order.payAmount || '0.00'}</p>
                      <p className="text-[10px] text-gray-400 mt-1">意向定金</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${ui.color}`}>
                        {ui.icon} {ui.text}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      {order.status === 1 && (
                        <>
                          <button onClick={() => handleStatusChange(order.id, 2, '确认已收尾款')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-transform active:scale-95">
                            结清尾款
                          </button>
                          <button onClick={() => handleStatusChange(order.id, 6, '退款并释放库存')} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                            退款退车
                          </button>
                        </>
                      )}
                      {order.status === 2 && (
                        <>
                          <button onClick={() => handleStatusChange(order.id, 3, '提交车管所过户')} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-transform active:scale-95">
                            开始过户
                          </button>
                          <button onClick={() => handleStatusChange(order.id, 6, '退款并释放库存')} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                            退款退车
                          </button>
                        </>
                      )}
                      {order.status === 3 && (
                        <>
                          <button onClick={() => handleStatusChange(order.id, 4, '确认过户完毕，交易闭环')} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 shadow-sm transition-transform active:scale-95">
                            过户完成 (完结)
                          </button>
                          <button onClick={() => handleStatusChange(order.id, 6, '退款并释放库存')} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                            退款退车
                          </button>
                        </>
                      )}
                      {(order.status === 4 || order.status === 5 || order.status === 6) && (
                        <span className="text-xs text-gray-300 font-bold italic">已归档</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center text-gray-400 italic">
                  暂无交易订单
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
