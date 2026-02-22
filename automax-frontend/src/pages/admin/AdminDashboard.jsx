import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, CarFront, AlertTriangle, 
  DollarSign, Activity, Package, Bell, ChevronRight, CreditCard, Clock, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardStats } from '../../api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboardStats().then(res => {
      if(res.data.success) setData(res.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Loader2 size={40} className="text-blue-500 animate-spin" />
      <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">正在聚合全链路业务数据...</p>
    </div>
  );

  const { stats, reminders = [], trendData = [], brandData = [], inventoryAgeData = [] } = data || {};

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
        <div className="text-sm font-bold text-gray-400 flex items-center bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100">
          <Activity size={16} className="mr-2 text-green-500 animate-pulse" />
          系统已接入实时流水数据
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
          <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-500" />
            近7日交易流水趋势 (意向金流入)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(v) => `¥${v}`} />
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                {/* 🌟 核心动画优化：划线时间1.5秒，点在最后才闪现 */}
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="流水金额"
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1500}
                  dot={{ r: 4, fill: '#fff', stroke: '#2563eb', strokeWidth: 3 }}
                />
              </AreaChart>
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