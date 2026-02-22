import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, CarFront, AlertTriangle, 
  DollarSign, Activity, Package, Bell, ChevronRight, CreditCard, Clock, Loader2, Trophy
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardStats } from '../../api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
const LINE_COLORS = ['#2563eb', '#0f766e', '#dc2626', '#7c3aed', '#ea580c', '#0891b2'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [storeId, setStoreId] = useState('');
  const [metric, setMetric] = useState('revenue');
  const [rankBy, setRankBy] = useState('revenue');
  const [rankOrder, setRankOrder] = useState('desc');

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (role === 'ADMIN' && storeId) params.storeId = storeId;
      params.metric = metric;
      const res = await getDashboardStats(params);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(false);

    // 自动轮询，避免管理员不刷新看不到新任务
    const timer = setInterval(() => fetchStats(true), 15000);
    const onNotice = () => fetchStats(true);
    window.addEventListener('admin:notice', onNotice);

    return () => {
      clearInterval(timer);
      window.removeEventListener('admin:notice', onNotice);
    };
  }, [storeId, metric]);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Loader2 size={40} className="text-blue-500 animate-spin" />
      <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">正在聚合全链路业务数据...</p>
    </div>
  );

  const { stats, reminders = [], trendData = [], brandData = [], inventoryAgeData = [], storeRanking = [], storeOptions = [], availableMetrics = [], scope = {}, trendMode = 'single', trendStores = [], selectedMetric = 'revenue' } = data || {};
  const isMultiTrend = trendMode === 'multi' && trendStores.length > 0;
  const sortedRanking = [...(storeRanking || [])].sort((a, b) => {
    const av = Number(a?.[rankBy] || 0);
    const bv = Number(b?.[rankBy] || 0);
    return rankOrder === 'desc' ? bv - av : av - bv;
  });
  const rankingTop = sortedRanking.slice(0, 5);
  const maxRevenue = Math.max(...rankingTop.map((r) => Number(r.revenue || 0)), 1);
  const maxOrders = Math.max(...rankingTop.map((r) => Number(r.orderCount || 0)), 1);
  const maxLeads = Math.max(...rankingTop.map((r) => Number(r.leadCount || 0)), 1);
  const rankReason = (row) => {
    const rv = Number(row.revenue || 0) / maxRevenue;
    const ov = Number(row.orderCount || 0) / maxOrders;
    const lv = Number(row.leadCount || 0) / maxLeads;
    if (rv >= ov && rv >= lv) return '营收领先';
    if (ov >= rv && ov >= lv) return '订单领先';
    return '收车量领先';
  };
  const handleRankSort = (key) => {
    if (rankBy === key) {
      setRankOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setRankBy(key);
    setRankOrder('desc');
  };
  const sortArrow = (key) => {
    if (rankBy !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{rankOrder === 'desc' ? '↓' : '↑'}</span>;
  };

  // 映射提醒图标和颜色
  const getReminderStyle = (type) => {
    if (type === 'stale') return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' };
    if (type === 'order') return { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' };
    return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' };
  };
  const getLevelStyle = (level) => {
    if (level === 'high') return 'text-red-300 bg-red-500/20';
    if (level === 'medium') return 'text-yellow-300 bg-yellow-500/20';
    return 'text-slate-300 bg-slate-500/30';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* 顶部标题区 */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900">商业智能 (BI) 看板</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">AutoMax 多门店经营数据实时监控台</p>
        </div>
        <div className="flex items-center gap-2">
          {scope?.canSwitchStore && (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700"
            >
              <option value="">全部门店</option>
              {storeOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.storeName}</option>
              ))}
            </select>
          )}
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700"
          >
            {(availableMetrics.length ? availableMetrics : [{ key: 'revenue', label: '意向金趋势' }]).map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <div className="text-sm font-bold text-gray-400 flex items-center bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100">
            <Activity size={16} className="mr-2 text-green-500 animate-pulse" />
            {scope?.isAdmin ? '总部视图' : '门店视图'}
          </div>
        </div>
      </div>

      {/* 核心指标卡片 (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="本月总交易营收" value={`¥${(stats?.totalRevenue || 0).toLocaleString()}`} trend="实时统计" trendUp={true} icon={<DollarSign size={24} className="text-blue-600" />} bg="bg-blue-50" />
        <MetricCard title="当前库源总数" value={`${stats?.inventoryCount || 0} 辆`} trend="实时统计" trendUp={true} icon={<CarFront size={24} className="text-indigo-600" />} bg="bg-indigo-50" />
        <MetricCard title="本月新增收车请求" value={`${stats?.newLeads || 0} 条`} trend="实时统计" trendUp={true} icon={<Users size={24} className="text-purple-600" />} bg="bg-purple-50" />
        <MetricCard title="滞销积压预警" value={`${stats?.staleWarning || 0} 辆`} trend="需立即采取措施" trendUp={false} icon={<AlertTriangle size={24} className="text-red-600" />} bg="bg-red-50" />
      </div>

      {/* 第一排图表：流水趋势 + 库龄分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左侧：营收趋势面积图 */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center justify-between">
            <span className="flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-500" />
            近7日趋势 ({selectedMetric === 'revenue' ? '意向金' : selectedMetric === 'orders' ? '订单量' : '收车量'})
            </span>
            {isMultiTrend && <span className="text-xs text-gray-400 font-bold">多门店对比</span>}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              {isMultiTrend ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                  <Legend />
                  {trendStores.map((s, idx) => (
                    <Line
                      key={s.dataKey}
                      type="monotone"
                      dataKey={s.dataKey}
                      name={s.storeName}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 2.5 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name={selectedMetric === 'revenue' ? '意向金' : selectedMetric === 'orders' ? '订单量' : '收车量'}
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={1500}
                    dot={{ r: 4, fill: '#fff', stroke: '#2563eb', strokeWidth: 3 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧：饼图 */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
            <Package size={20} className="mr-2 text-orange-500" />
            库龄健康分布
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              <PieChart>
                <Pie data={inventoryAgeData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {COLORS.map((color, index) => <Cell key={index} fill={color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '1rem'}} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-400 text-center font-medium italic mt-4">数据基于入库时间实时计算</p>
        </div>
      </div>

      {/* 第二排图表：品牌分布 + 待办提醒 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左侧：品牌库存柱状图 */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center">
            <CarFront size={20} className="mr-2 text-emerald-500" />
            TOP 5 品牌库存水位监控
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              <BarChart data={brandData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} animationDuration={2000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧：动态待办列表 */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Bell size={120} />
          </div>
          <h3 className="text-lg font-black mb-8 flex items-center relative z-10">
            <Bell size={18} className="mr-2 text-yellow-400 animate-bounce" />
            待办与预警提醒
          </h3>
          
          <div className="flex-1 space-y-4 relative z-10 overflow-y-auto pr-1 scrollbar-hide">
            {reminders.map((item, idx) => {
              const style = getReminderStyle(item.type);
              return (
                <div key={idx} onClick={() => navigate(item.link)} 
                     className="group flex gap-4 p-4 rounded-[2rem] bg-white/10 border border-white/5 hover:bg-white/15 transition-all cursor-pointer">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                    <style.icon size={18} className={style.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{item.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${getLevelStyle(item.level)}`}>{item.level === 'high' ? '高优' : item.level === 'medium' ? '中优' : '日常'}</span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1 leading-relaxed line-clamp-2">{item.desc}</p>
                                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.link);
                      }}
                      className="mt-2 text-[10px] px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                    >
                      {item.actionText || '立即处理'}
                    </button>
                  </div>
                  <div className="flex items-center text-white/20 group-hover:text-blue-400 transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => navigate(reminders[0]?.link || '/admin')}
            className="mt-6 w-full py-4 text-xs font-black text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all relative z-10 uppercase tracking-widest"
          >
            进入首要任务
          </button>
        </div>

      </div>

      <div className="bg-white p-6 rounded-[1.75rem] shadow-sm border border-gray-100 max-w-[80rem] mx-auto w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-gray-900 flex items-center">
            <Trophy size={18} className="mr-2 text-amber-500" />
            门店数据总览
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold">按此重排</span>
            <select
              value={rankBy}
              onChange={(e) => {
                setRankBy(e.target.value);
                setRankOrder('desc');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700"
            >
              <option value="revenue">本月营收</option>
              <option value="orderCount">订单数</option>
              <option value="inventoryCount">在库车源</option>
              <option value="leadCount">收车量</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="mx-auto w-auto min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-sm font-black text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="py-3 px-4 text-center whitespace-nowrap">排名</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">门店</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  <button type="button" onClick={() => handleRankSort('revenue')} className={`inline-flex items-center ${rankBy === 'revenue' ? 'text-gray-700' : 'text-gray-400'} hover:text-gray-700`}>
                    本月营收{sortArrow('revenue')}
                  </button>
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  <button type="button" onClick={() => handleRankSort('orderCount')} className={`inline-flex items-center ${rankBy === 'orderCount' ? 'text-gray-700' : 'text-gray-400'} hover:text-gray-700`}>
                    订单数{sortArrow('orderCount')}
                  </button>
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  <button type="button" onClick={() => handleRankSort('inventoryCount')} className={`inline-flex items-center ${rankBy === 'inventoryCount' ? 'text-gray-700' : 'text-gray-400'} hover:text-gray-700`}>
                    在库车源{sortArrow('inventoryCount')}
                  </button>
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  <button type="button" onClick={() => handleRankSort('leadCount')} className={`inline-flex items-center ${rankBy === 'leadCount' ? 'text-gray-700' : 'text-gray-400'} hover:text-gray-700`}>
                    收车量{sortArrow('leadCount')}
                  </button>
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">优势项</th>
              </tr>
            </thead>
            <tbody>
              {rankingTop.map((row, idx) => (
                <tr key={`${row.storeId}-${idx}`} className="border-b border-gray-50 text-sm odd:bg-white even:bg-slate-50/30">
                  <td className="py-3 px-4 text-center font-black text-gray-700 whitespace-nowrap">#{idx + 1}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-900 whitespace-nowrap">{row.storeName}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 tabular-nums whitespace-nowrap">¥{Number(row.revenue || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center text-gray-700 tabular-nums whitespace-nowrap">{row.orderCount || 0}</td>
                  <td className="py-3 px-4 text-center text-gray-700 tabular-nums whitespace-nowrap">{row.inventoryCount || 0}</td>
                  <td className="py-3 px-4 text-center text-gray-700 tabular-nums whitespace-nowrap">{row.leadCount || 0}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {rankReason(row)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, trendUp, icon, bg }) {
  return (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:-translate-y-1 transition-all">
      <div>
        <p className="text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 mb-2">{value}</h3>
        <p className={`text-[10px] font-bold ${trendUp ? 'text-green-500' : 'text-red-500'} flex items-center`}>
          <span className={`inline-block mr-1 ${trendUp ? 'rotate-[-45deg]' : 'rotate-[45deg]'}`}>➔</span>
          {trend} <span className="text-gray-300 ml-1 font-medium">较上月</span>
        </p>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
    </div>
  );
}
