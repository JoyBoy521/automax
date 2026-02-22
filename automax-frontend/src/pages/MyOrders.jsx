import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Car, ShieldCheck, ChevronRight, AlertCircle, MapPin } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { getMyOrderList, cancelOrder } from '../api';

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const parseAmount = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const formatAmount = (value) => {
    const num = parseAmount(value);
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getMyOrderList();
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
  }, []);

  // C 端用户主动取消订单
const handleCancelOrder = async (orderId) => {
    const isConfirm = window.confirm("确定要取消预定吗？\n您的意向定金将原路退回，车辆将被重新释放到市场供他人购买。");
    if (!isConfirm) return;

    try {
      // 🌟 这里改为调用 C 端专属的取消接口，不再借用 admin 接口
      const res = await cancelOrder(orderId); 
      if (res.data && res.data.success) {
        alert("✨ 订单已成功取消！意向金将在1-3个工作日内退回。");
        fetchOrders(); // 刷新当前订单列表，你会看到状态变成了“已取消”
      } else {
        alert(res.data.msg || "取消失败");
      }
    } catch (err) {
      alert("网络异常，取消失败，请重试");
    }
  };

  // C 端专属的状态解析 UI (相比 B 端更人性化)
  const getStatusUI = (status) => {
    switch (status) {
      case 1: return { text: '预定成功，待付尾款', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Clock size={16} className="mr-1.5" /> };
      case 2: return { text: '尾款已结清', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: <CheckCircle2 size={16} className="mr-1.5" /> };
      case 3: return { text: '车管所过户中', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <Car size={16} className="mr-1.5" /> };
      case 4: return { text: '交易完成', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <ShieldCheck size={16} className="mr-1.5" /> };
      case 5: case 6: return { text: '已取消 / 退款', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: <XCircle size={16} className="mr-1.5" /> };
      default: return { text: '未知状态', color: 'text-gray-500 bg-gray-50', icon: null };
    }
  };

  const getProgressMeta = (status) => {
    switch (status) {
      case 1:
        return { progress: 25, todo: '请在 24 小时内确认到店验车时间，并准备尾款支付。' };
      case 2:
        return { progress: 55, todo: '尾款已支付，等待门店提交过户材料。' };
      case 3:
        return { progress: 80, todo: '过户处理中，请保持电话畅通，等待提车通知。' };
      case 4:
        return { progress: 100, todo: '交易已完成，建议在「服务保障」中查看售后权益。' };
      case 5:
      case 6:
        return { progress: 100, todo: '订单已取消，退款通常会在 1-3 个工作日内到账。' };
      default:
        return { progress: 0, todo: '订单状态同步中，请稍后刷新重试。' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      {/* 复用你已经写好的全局导航栏 */}
      <GlobalHeader />

      <main className="pt-28 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">我的订单</h1>
          <p className="text-gray-500 mt-2 font-medium">查看车辆履约进度与历史交易记录</p>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-20 text-gray-400 font-medium animate-pulse">
              正在同步您的订单数据...
            </div>
          ) : orders.length > 0 ? (
            orders.map(order => {
              const ui = getStatusUI(order.status);
              const progressMeta = getProgressMeta(order.status);
              const carName = order.carName || `车辆ID ${order.skuId}`;
              const carBrand = order.carBrand || 'AutoMax';
              const orderNo = order.displayOrderNo || order.orderNo || `AMX-${String(order.id || '').padStart(6, '0')}`;
              const paidAmount = parseAmount(order.payAmount ?? order.amount);
              const totalAmount = parseAmount(order.totalAmount);
              const remainingAmount = Math.max(totalAmount - paidAmount, 0);
              return (
                <div key={order.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  
                  {/* 卡片头部：状态与订单号 */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-5 mb-5 gap-4">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold border ${ui.color}`}>
                        {ui.icon} {ui.text}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">订单号: {orderNo}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium flex items-center">
                      下单时间：{order.createTime || '刚刚'}
                    </div>
                  </div>

                  {/* 卡片主体：车辆信息与金额 */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-28 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                        {order.carCover ? (
                          <img src={order.carCover} alt={carName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">暂无图片</div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {carBrand} · {carName}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center mt-2">
                          <MapPin size={14} className="mr-1 text-gray-400" />
                          该车已锁定，销售顾问将联系您确认到店安排。
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-500 mb-1">已付意向定金</p>
                      <div className="flex items-baseline text-red-600 justify-start sm:justify-end">
                        <span className="text-lg font-bold mr-1">¥</span>
                        <span className="text-3xl font-black">{formatAmount(paidAmount)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">车辆总价：¥{totalAmount > 0 ? formatAmount(totalAmount) : '待确认'}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">待付尾款：¥{totalAmount > 0 ? formatAmount(remainingAmount) : '待确认'}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-2 text-xs text-gray-500 font-medium">
                      <span>订单进度</span>
                      <span>{progressMeta.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${progressMeta.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-2xl border border-blue-100 bg-blue-50/60">
                    <div className="text-xs text-blue-500 font-bold mb-1">当前待办</div>
                    <div className="text-sm text-gray-700 font-medium leading-relaxed">{progressMeta.todo}</div>
                  </div>

                  {/* 卡片底部：操作按钮 */}
                  <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-3 justify-end">
                    <button 
                      onClick={() => navigate(`/my-orders/${order.id}`)}
                      className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors border border-blue-600"
                    >
                      查看订单详情
                    </button>
                    <button 
                      onClick={() => navigate(`/car/${order.carId || order.skuId}`)}
                      className="px-5 py-2.5 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      查看车辆详情
                    </button>
                    
                    {/* 只有状态为1（已付定金）时，才允许用户主动取消 */}
                    {order.status === 1 && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-5 py-2.5 bg-white text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors border border-red-200"
                      >
                        取消预定并退款
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">暂无购车订单</h3>
              <p className="text-gray-500 text-sm mb-6">您还没有预定任何车辆，去车源大厅逛逛吧</p>
              <button 
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
              >
                浏览精选车源
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
