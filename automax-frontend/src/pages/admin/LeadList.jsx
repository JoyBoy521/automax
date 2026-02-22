import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, MapPin, Car, Calendar, RefreshCcw,
  ClipboardList, ArrowRight, CheckCircle2, Ban,
  Search, Filter, Sparkles, PlusCircle, RotateCcw
} from 'lucide-react';
import { getLeadList, updateLeadStatus } from '../../api';

const STATUS_META = {
  0: {
    text: '新线索',
    badge: 'text-blue-600 bg-blue-50 border-blue-100',
    dot: 'bg-blue-500'
  },
  1: {
    text: '评估跟进中',
    badge: 'text-amber-600 bg-amber-50 border-amber-100',
    dot: 'bg-amber-500'
  },
  2: {
    text: '已关闭',
    badge: 'text-slate-600 bg-slate-100 border-slate-200',
    dot: 'bg-slate-400'
  },
  4: {
    text: '已转车辆档案',
    badge: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    dot: 'bg-emerald-500'
  }
};

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '新线索' },
  { key: 'processing', label: '评估中' },
  { key: 'converted', label: '已转档' },
  { key: 'closed', label: '已关闭' }
];

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await getLeadList();
      // 假设后端返回的是数组，如果带了 code/data 结构请自行调整
      setLeads(res.data.success ? res.data.data : (res.data || []));
    } catch (error) {
      console.error('获取收车请求失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateLeadStatus(id, newStatus);
      fetchLeads();
    } catch (error) {
      alert("更新状态失败");
    }
  };

  // 🌟 日期格式化：转换为 2026-02-22 17:29 格式
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

  const filteredLeads = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchKeyword = !key || [
        lead.userPhone,
        lead.intentionModel,
        lead.city,
        String(lead.expectedPrice || '')
      ].join(' ').toLowerCase().includes(key);

      if (!matchKeyword) return false;
      if (filter === 'all') return true;
      if (filter === 'new') return lead.status === 0;
      if (filter === 'processing') return lead.status === 1;
      if (filter === 'converted') return lead.status === 4;
      if (filter === 'closed') return lead.status === 2;
      return true;
    });
  }, [leads, keyword, filter]);

  const stats = useMemo(() => ({
    all: leads.length,
    new: leads.filter((x) => x.status === 0).length,
    processing: leads.filter((x) => x.status === 1).length,
    converted: leads.filter((x) => x.status === 4).length,
    closed: leads.filter((x) => x.status === 2).length
  }), [leads]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-[2rem] p-6 text-white shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">AutoMax CRM</p>
            <h1 className="text-2xl font-black mt-1">收车商机中心</h1>
            <p className="text-slate-300 text-sm mt-1">从线索接入 → 评估跟进 → 转车辆档案，一屏闭环处理</p>
          </div>
          <button
            onClick={fetchLeads}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold flex items-center"
          >
            <RefreshCcw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 刷新商机
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="总商机" value={stats.all} tone="slate" />
        <StatCard title="新线索" value={stats.new} tone="blue" />
        <StatCard title="评估中" value={stats.processing} tone="amber" />
        <StatCard title="已转档" value={stats.converted} tone="emerald" />
        <StatCard title="已关闭" value={stats.closed} tone="gray" />
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="按手机号/车型/城市检索"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${filter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                <Filter size={12} className="inline mr-1" />{f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const meta = STATUS_META[lead.status] || STATUS_META[0];
            return (
              <div key={lead.id} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${meta.dot}`} />{meta.text}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center">
                        <Calendar size={12} className="mr-1" /> {formatDate(lead.createTime)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p className="font-semibold text-gray-900 flex items-center"><Phone size={14} className="mr-1.5 text-gray-400" />{lead.userPhone}</p>
                      <p className="text-gray-600 flex items-center"><MapPin size={14} className="mr-1.5 text-gray-400" />{lead.city || '-'}</p>
                      <p className="text-gray-700 flex items-center md:col-span-2"><Car size={14} className="mr-1.5 text-gray-400" />{lead.intentionModel || '未填写车型'} · 里程 {lead.mileage || '-'} 万公里</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-100 text-sm font-black">
                      估价 ¥{lead.expectedPrice || '-'} 万
                    </div>
                    <ActionButtons
                      lead={lead}
                      onChangeStatus={handleStatusChange}
                      onConvert={() => navigate('/admin/add', { state: { fromLead: lead } })}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filteredLeads.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <ClipboardList size={44} className="mx-auto mb-3 text-gray-300" />
              <p className="font-bold">当前筛选下暂无商机</p>
            </div>
          )}
        </div>
      </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 flex items-center mb-3"><Sparkles size={16} className="mr-2 text-indigo-500" />推荐流程</h3>
        <div className="flex flex-wrap items-center text-sm text-gray-600 gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">新线索</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700">评估跟进</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">转车辆档案</span>
          <ArrowRight size={14} />
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">闭环归档</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, tone }) {
  const toneMap = {
    slate: 'bg-slate-900 text-white',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    gray: 'bg-slate-100 text-slate-600 border border-slate-200'
  };

  return (
    <div className={`rounded-2xl px-4 py-4 ${toneMap[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

function ActionButtons({ lead, onChangeStatus, onConvert }) {
  if (lead.status === 0) {
    return (
      <div className="flex gap-2">
        <button onClick={() => onChangeStatus(lead.id, 1)} className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700">
          <PlusCircle size={13} className="inline mr-1" />领取跟进
        </button>
        <button onClick={() => onChangeStatus(lead.id, 2)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
          <Ban size={13} className="inline mr-1" />关闭
        </button>
      </div>
    );
  }

  if (lead.status === 1) {
    return (
      <div className="flex gap-2">
        <button onClick={onConvert} className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700">
          <CheckCircle2 size={13} className="inline mr-1" />生成车辆档案
        </button>
        <button onClick={() => onChangeStatus(lead.id, 2)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
          <Ban size={13} className="inline mr-1" />关闭
        </button>
      </div>
    );
  }

  if (lead.status === 2) {
    return (
      <button onClick={() => onChangeStatus(lead.id, 0)} className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600">
        <RotateCcw size={13} className="inline mr-1" />重新激活
      </button>
    );
  }

  if (lead.status === 4) {
    return (
      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
        已完成转档
      </span>
    );
  }

  return null;
}