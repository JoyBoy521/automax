import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Clock, CreditCard, FileText, MapPin, Phone, ShieldCheck, XCircle } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { getMyOrderDetail, saveMyAppointment } from '../api';

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const res = await getMyOrderDetail(id);
        if (res.data?.success) {
          setOrder(res.data.data);
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error('加载订单详情失败', err);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!order) return;
    setBookingTime(order.appointmentTime ? order.appointmentTime.slice(0, 16) : '');
    setBookingNote(order.appointmentRemark || '');
  }, [order]);

  const parseAmount = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const formatAmount = (value) =>
    parseAmount(value).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const formatCnDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}年${m}月${d}日 ${hh}:${mm}`;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1: return '预定成功，待付尾款';
      case 2: return '尾款已结清';
      case 3: return '车管所过户中';
      case 4: return '交易完成';
      case 5:
      case 6: return '已取消 / 退款';
      default: return '状态同步中';
    }
  };

  const getProgress = (status) => {
    switch (status) {
      case 1: return 25;
      case 2: return 55;
      case 3: return 80;
      case 4:
      case 5:
      case 6: return 100;
      default: return 0;
    }
  };

  const buildSteps = (status) => {
    const current = Number(status);
    return [
      {
        key: 'lock',
        done: current >= 1,
        title: '锁车预定',
        desc: '已支付意向定金，订单已锁定库存',
        icon: <CreditCard size={16} />
      },
      {
        key: 'pay',
        done: current >= 2,
        title: '尾款支付',
        desc: '到店验车后完成尾款支付与签约',
        icon: <Clock size={16} />
      },
      {
        key: 'transfer',
        done: current >= 3,
        title: '办理过户',
        desc: '门店协助提交资料，办理过户流程',
        icon: <FileText size={16} />
      },
      {
        key: 'done',
        done: current >= 4,
        title: '交易完成',
        desc: '完成交付，售后保障生效',
        icon: <ShieldCheck size={16} />
      }
    ];
  };

  const saveBooking = async () => {
    if (!order?.id) {
      return;
    }
    if (!bookingTime) {
      alert('请先选择到店时间');
      return;
    }
    try {
      const res = await saveMyAppointment(order.id, {
        appointmentTime: bookingTime,
        appointmentRemark: bookingNote.trim()
      });
      if (res.data?.success) {
        setOrder(prev => ({
          ...prev,
          appointmentTime: bookingTime,
          appointmentRemark: bookingNote.trim()
        }));
        alert('预约信息已保存，顾问会尽快与您确认。');
      } else {
        alert(res.data?.msg || '预约保存失败');
      }
    } catch (err) {
      alert('网络异常，预约保存失败');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <GlobalHeader />
        <main className="pt-28 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-52 bg-gray-100 rounded-3xl animate-pulse" />
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <GlobalHeader />
        <main className="pt-28 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
            <XCircle size={40} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">订单不存在或无权限查看</h2>
            <button
              onClick={() => navigate('/my-orders')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              返回我的订单
            </button>
          </div>
        </main>
      </div>
    );
  }

  const paidAmount = parseAmount(order.payAmount ?? order.amount);
  const totalAmount = parseAmount(order.totalAmount);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const progress = getProgress(order.status);
  const steps = buildSteps(order.status);
  const carName = order.carName || `车辆ID ${order.skuId}`;
  const carBrand = order.carBrand || 'AutoMax';
  const orderNo = order.displayOrderNo || order.orderNo || `AMX-${String(order.id || '').padStart(6, '0')}`;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <GlobalHeader />
      <main className="pt-28 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-gray-900">订单详情</h1>
            <p className="text-gray-500 mt-2 text-sm">订单号：{orderNo}</p>
          </div>
          <button
            onClick={() => navigate('/my-orders')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </button>
        </div>

        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-full md:w-44 h-28 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
              {order.carCover ? (
                <img src={order.carCover} alt={carName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">暂无图片</div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-gray-900">{carBrand} · {carName}</h2>
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <MapPin size={14} className="mr-1 text-gray-400" />
                当前状态：{getStatusText(order.status)}
              </p>
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <CalendarDays size={14} className="mr-1 text-gray-400" />
                下单时间：{order.createTime || '刚刚'}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-gray-500">已付意向金</p>
              <p className="text-3xl font-black text-red-600 mt-1">¥{formatAmount(paidAmount)}</p>
              <p className="text-xs text-gray-500 mt-2">总价：¥{totalAmount > 0 ? formatAmount(totalAmount) : '待确认'}</p>
              <p className="text-sm font-bold text-blue-600 mt-1">待付尾款：¥{totalAmount > 0 ? formatAmount(remainingAmount) : '待确认'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-black text-gray-900">履约进度</h3>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {steps.map((item) => (
              <div
                key={item.key}
                className={`rounded-2xl border p-4 ${item.done ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}
              >
                <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${item.done ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                  {item.icon}
                  <span className="ml-1">{item.done ? '已完成' : '待完成'}</span>
                </div>
                <h4 className="font-bold text-gray-900 mt-3">{item.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
          <h3 className="text-base font-black text-gray-900 mb-2">下一步建议</h3>
          <p className="text-sm text-gray-600">
            {order.status === 1
              ? '请尽快联系销售顾问确认到店验车时间，并准备尾款支付。'
              : order.status === 2
                ? '尾款已完成，请准备身份证明资料，等待门店通知过户。'
                : order.status === 3
                  ? '过户办理中，请保持电话畅通，等待提车通知。'
                  : order.status === 4
                    ? '交易已完成，可在我的订单查看历史记录。'
                    : '订单已关闭或退款中，如有疑问请联系门店。'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {order.storePhone && (
              <a
                href={`tel:${order.storePhone}`}
                className="px-5 py-2.5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-black"
              >
                联系顾问：{order.storePhone}
              </a>
            )}
            <button
              onClick={() => navigate(`/car/${order.carId || order.skuId}`)}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50"
            >
              查看车辆详情
            </button>
            <button
              onClick={() => navigate('/my-orders')}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700"
            >
              返回订单列表
            </button>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6 mt-6">
          <h3 className="text-base font-black text-gray-900">预约到店</h3>
          <p className="text-sm text-gray-500 mt-2">
            {order.storeName ? `${order.storeName}` : 'AutoMax 门店'}{order.storeAddress ? ` · ${order.storeAddress}` : ''}
          </p>
          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <input
              type="datetime-local"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            />
            <input
              type="text"
              value={bookingNote}
              onChange={(e) => setBookingNote(e.target.value)}
              placeholder="备注（可选，例如：周末上午到店）"
              className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={saveBooking}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700"
            >
              保存预约信息
            </button>
            {order.storePhone && (
              <a
                href={`tel:${order.storePhone}`}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 inline-flex items-center"
              >
                <Phone size={14} className="mr-1.5" />
                电话确认
              </a>
            )}
          </div>
          {order.appointmentTime && (
            <div className="mt-4 text-sm rounded-2xl bg-green-50 border border-green-100 p-4 text-green-800">
              已预约时间：{formatCnDateTime(order.appointmentTime)} {order.appointmentRemark ? `| 备注：${order.appointmentRemark}` : ''}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
