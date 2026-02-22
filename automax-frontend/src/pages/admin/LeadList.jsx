import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, MapPin, Car, CircleDollarSign, Calendar, 
  Search, RefreshCcw, MoreHorizontal, UserCheck, 
  Ban, PackagePlus, CheckCircle2, AlertCircle, Clock,Zap
} from 'lucide-react';
import { getLeadList, updateLeadStatus } from '../../api';

const LeadList = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
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
      console.error('获取线索失败', error);
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
  const formatChineseDate = (dateStr) => {
    if (!dateStr) return "-";
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

  // 🌟 状态标签美化
  const getStatusConfig = (status) => {
    switch (status) {
      case 0: return { 
        text: '待处理', 
        color: 'text-rose-600 bg-rose-50 border-rose-100', 
        icon: <Clock size={14} className="mr-1" /> 
      };
      case 1: return { 
        text: '跟进中', 
        color: 'text-amber-600 bg-amber-50 border-amber-100', 
        icon: <RefreshCcw size={14} className="mr-1 animate-spin-slow" /> 
      };
      case 2: return { 
        text: '已取消', 
        color: 'text-slate-500 bg-slate-50 border-slate-100', 
        icon: <Ban size={14} className="mr-1" /> 
      };
      case 4: return { 
        text: '已入库', 
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
        icon: <CheckCircle2 size={14} className="mr-1" /> 
      };
      default: return { text: '未知', color: 'text-gray-400 bg-gray-50', icon: null };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. 顶部统计面板 (让管理后台更有专业感) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><AlertCircle size={24}/></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">待处理线索</p>
            <p className="text-2xl font-black text-gray-900">{leads.filter(l => l.status === 0).length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><UserCheck size={24}/></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">正在跟进</p>
            <p className="text-2xl font-black text-gray-900">{leads.filter(l => l.status === 1).length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><PackagePlus size={24}/></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">成功转化</p>
            <p className="text-2xl font-black text-gray-900">{leads.filter(l => l.status === 4).length}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-5 rounded-3xl shadow-xl flex items-center space-x-4 text-white">
          <div className="p-3 bg-white/10 rounded-2xl text-yellow-400"><Zap size={24}/></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">总线索量</p>
            <p className="text-2xl font-black">{leads.length}</p>
          </div>
        </div>
      </div>

      {/* 2. 表格区域 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h2 className="text-xl font-black text-gray-900 flex items-center">
            收车线索管理 <span className="ml-3 px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-md">{leads.length} Records</span>
          </h2>
          <button 
            onClick={fetchLeads}
            className="p-2 hover:bg-white rounded-xl transition-all hover:shadow-md text-gray-400 hover:text-blue-500"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">客户信息 / 提交时间</th>
                <th className="px-6 py-6 font-medium">意向车型</th>
                <th className="px-6 py-6 font-medium text-center">估价/城市</th>
                <th className="px-6 py-6 font-medium text-center">当前状态</th>
                <th className="px-8 py-6 text-right">流转操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(lead => {
                const status = getStatusConfig(lead.status);
                return (
                  <tr key={lead.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-gray-100 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <Phone size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 tracking-tight">{lead.userPhone}</p>
                          <p className="text-[10px] text-gray-400 flex items-center mt-0.5">
                            <Calendar size={10} className="mr-1"/> {formatChineseDate(lead.createTime)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-2">
                        <Car size={16} className="text-gray-300"/>
                        <span className="font-bold text-gray-800 text-sm">{lead.intentionModel}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 pl-6">行驶里程: {lead.mileage} 万公里</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-yellow-600 text-lg">¥ {lead.expectedPrice}<small className="text-[10px] ml-0.5 font-bold">万</small></span>
                        <span className="text-[10px] text-gray-400 flex items-center mt-1">
                          <MapPin size={10} className="mr-0.5"/> {lead.city}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${status.color}`}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end space-x-2">
                        {lead.status === 0 && (
                          <button 
                            onClick={() => handleStatusChange(lead.id, 1)}
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                          >
                            开始跟进
                          </button>
                        )}
                        {lead.status === 1 && (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigate('/admin/add', { state: { fromLead: lead } })}
                              className="px-4 py-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-100 transition-all flex items-center"
                            >
                              <PackagePlus size={14} className="mr-1"/> 转入库存
                            </button>
                            <button 
                              onClick={() => handleStatusChange(lead.id, 2)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="标记取消"
                            >
                              <Ban size={18} />
                            </button>
                          </div>
                        )}
                        {lead.status === 4 && (
                          <span className="text-xs text-gray-300 font-bold italic tracking-widest">已转B端档案</span>
                        )}
                        {(lead.status === 2) && (
                           <span className="text-xs text-gray-300 font-bold italic tracking-widest uppercase">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* 🌟 空状态美化 */}
          {leads.length === 0 && !loading && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-300">
              <div className="p-6 bg-gray-50 rounded-[2.5rem] mb-4">
                <Search size={48} />
              </div>
              <p className="font-bold tracking-widest">暂无活跃收车线索</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadList;