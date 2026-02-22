import React from 'react';
import { useNavigate } from 'react-router-dom'; // 🌟 引入路由跳转钩子
import { 
  TrendingUp, Users, CarFront, AlertTriangle, 
  DollarSign, Activity, Package, Bell, ChevronRight, CreditCard, Clock
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- 逼真的模拟数据 (Mock Data) ---
const revenueData = [
  { name: '10-01', 意向金: 4000, 尾款成交: 240000 },
  { name: '10-02', 意向金: 3000, 尾款成交: 139800 },
  { name: '10-03', 意向金: 2000, 尾款成交: 980000 },
  { name: '10-04', 意向金: 2780, 尾款成交: 390800 },
  { name: '10-05', 意向金: 1890, 尾款成交: 480000 },
  { name: '10-06', 意向金: 2390, 尾款成交: 380000 },
  { name: '10-07', 意向金: 3490, 尾款成交: 430000 },
];

const brandData = [
  { name: '本田', count: 45 },
  { name: '丰田', count: 38 },
  { name: '宝马', count: 28 },
  { name: '特斯拉', count: 18 },
  { name: '奥迪', count: 15 },
];

const inventoryAgingData = [
  { name: '健康 (<30天)', value: 65, color: '#10b981' }, // 绿
  { name: '预警 (30-60天)', value: 25, color: '#f59e0b' }, // 橙
  { name: '滞销 (>60天)', value: 10, color: '#ef4444' }, // 红
];

// 🌟 新增：事件提醒与待办数据 (包含跳转链接)
const remindersData = [
  { 
    id: 1, 
    title: '12 辆车库存严重滞销', 
    desc: '入库超过 60 天，资金占用严重，建议立即采取降价或调拨措施。', 
    time: '10 分钟前', 
    link: '/admin', // 跳转到车辆列表页
    icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' 
  },
  { 
    id: 2, 
    title: '有 3 笔订单待核销尾款', 
    desc: '客户已在线下看车，等待店长确认收款并流转订单状态。', 
    time: '1 小时前', 
    link: '/admin/orders', // 跳转到订单管理页
    icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' 
  },
  { 
    id: 3, 
    title: '收到 1 个退单退款申请', 
    desc: '客户已在前台主动取消预定，请及时审批并释放该车辆库存。', 
    time: '2 小时前', 
    link: '/admin/orders', // 跳转到订单管理页
    icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' 
  },
  { 
    id: 4, 
    title: '今日新增 5 台可售车源', 
    desc: '评估师已完成上架录入，档案已生效，前台已同步展示。', 
    time: '5 小时前', 
    link: '/admin', // 跳转到车辆列表页
    icon: CarFront, color: 'text-emerald-500', bg: 'bg-emerald-50' 
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate(); // 🌟 初始化路由钩子

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 顶部标题区 */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商业智能 (BI) 看板</h1>
          <p className="text-sm text-gray-500 mt-1">AutoMax 多门店经营数据实时监控台</p>
        </div>
        <div className="text-sm font-medium text-gray-400 flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <Activity size={16} className="mr-2 text-green-500 animate-pulse" />
          数据实时同步中
        </div>
      </div>

      {/* 核心指标卡片 (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="本月总交易额" value="¥ 3,450.8 万" trend="+12.5%" trendUp={true} icon={<DollarSign size={24} className="text-blue-600" />} bg="bg-blue-50" />
        <MetricCard title="在库车源总数" value="156 辆" trend="+5.2%" trendUp={true} icon={<CarFront size={24} className="text-indigo-600" />} bg="bg-indigo-50" />
        <MetricCard title="本月新增线索" value="892 条" trend="-2.1%" trendUp={false} icon={<Users size={24} className="text-purple-600" />} bg="bg-purple-50" />
        <MetricCard title="重度滞销预警" value="12 辆" trend="需立即降价" trendUp={false} icon={<AlertTriangle size={24} className="text-red-600" />} bg="bg-red-50" />
      </div>

      {/* 图表主区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左侧宽图：营收趋势折线图 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp size={18} className="mr-2 text-blue-500" />
            近7日交易流水趋势
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `${value/10000}W`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => `¥ ${value.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                <Line yAxisId="left" type="monotone" dataKey="尾款成交" stroke="#2563eb" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                <Line yAxisId="left" type="monotone" dataKey="意向金" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧：库龄健康度饼图 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Package size={18} className="mr-2 text-orange-500" />
            当前库龄健康度分布
          </h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventoryAgingData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {inventoryAgingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => `${value} 辆`} />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🌟 修改点：左侧(2/3宽度) 品牌库存柱状图 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <CarFront size={18} className="mr-2 text-emerald-500" />
            TOP 5 品牌库存水位分布
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value} 辆`, '库存数量']} />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🌟 新增：右侧(1/3宽度) 事件待办提醒列表 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Bell size={18} className="mr-2 text-purple-500" />
            待办与预警提醒
          </h3>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
            {remindersData.map(item => (
              <div 
                key={item.id} 
                onClick={() => navigate(item.link)} // 🚀 点击直接跳转对应路由
                className="group flex gap-4 p-3.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${item.bg}`}>
                  <item.icon size={18} className={item.color} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h4>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">{item.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center text-gray-300 group-hover:text-blue-500 transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full py-3 text-xs font-bold text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors">
            查看全部提醒
          </button>
        </div>

      </div>
    </div>
  );
}

// --- 辅助小组件：顶部数据卡片 ---
function MetricCard({ title, value, trend, trendUp, icon, bg }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-bold text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 mb-2">{value}</h3>
        <p className={`text-xs font-bold ${trendUp ? 'text-green-500' : 'text-red-500'} flex items-center`}>
          <span className={`inline-block mr-1 ${trendUp ? 'rotate-[-45deg]' : 'rotate-[45deg]'}`}>➔</span>
          {trend} 较上月
        </p>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  );
}