import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserCircle, ShieldCheck, Building2, Users, ShieldAlert, UserPlus, X, Save, Phone, ChevronDown, Check, MapPin } from 'lucide-react';
import { deleteAdminUser, getAdminUserList, getStoreList, offboardAdminUser, restoreAdminUser, saveAdminUser } from '../../api';
import { toast } from 'react-toastify';

export default function UserManagement() {
  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN';
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeFilter, setStoreFilter] = useState('');
  
  // 抽屉与表单状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', phone: '', role: 'STAFF', storeId: '' });
  
  // 下拉菜单控制与引用
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);

  // 初始化加载数据
  useEffect(() => { fetchData(); }, [storeFilter]);

  // 🌟 核心监听：点击下拉菜单外部区域时自动收起，代替原本会阻挡滚动的透明遮罩
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target)) {
        setStoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const userParams = isAdmin && storeFilter ? { storeId: storeFilter } : undefined;
      const requests = [getAdminUserList(userParams)];
      if (isAdmin) {
        requests.push(getStoreList());
      }
      const [uRes, sRes] = await Promise.all(requests);
      if (uRes.data.success) setUsers(uRes.data.data);
      if (sRes?.data?.success) setStores(sRes.data.data);
    } catch (error) { toast.error("数据加载失败"); }
  };

  const openDrawer = (user = null) => {
    setEditingUser(user);
    setStoreDropdownOpen(false); // 每次打开抽屉时重置下拉状态
    if (user) {
      setFormData({ ...user, password: '' }); 
    } else {
      setFormData({ username: '', password: '', phone: '', role: 'STAFF', storeId: isAdmin ? '' : (stores[0]?.id || '') });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.username) return toast.error("员工姓名/账号不能为空");
    if (isAdmin && (formData.role === 'STAFF' || formData.role === 'MANAGER') && !formData.storeId) {
      return toast.error("请先为员工分配门店");
    }
    try {
      const res = await saveAdminUser(formData);
      if (res.data.success) {
        toast.success(res.data.msg);
        setIsDrawerOpen(false);
        fetchData(); 
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) { toast.error("保存失败"); }
  };

  const handleOffboard = async (userId) => {
    const ok = window.confirm("确认将该员工标记为离岗吗？离岗后无法登录。");
    if (!ok) return;
    try {
      const res = await offboardAdminUser(userId);
      if (res.data?.success) {
        toast.success(res.data.msg || '已离岗');
        fetchData();
      } else {
        toast.error(res.data?.msg || '操作失败');
      }
    } catch (error) {
      toast.error("离岗操作失败");
    }
  };

  const handleRestore = async (userId) => {
    try {
      const res = await restoreAdminUser(userId);
      if (res.data?.success) {
        toast.success(res.data.msg || '已恢复');
        fetchData();
      } else {
        toast.error(res.data?.msg || '恢复失败');
      }
    } catch (error) {
      toast.error("恢复失败");
    }
  };

  const handleDelete = async (userId) => {
    const ok = window.confirm("确认彻底删除该离岗员工档案吗？此操作不可撤销。");
    if (!ok) return;
    try {
      const res = await deleteAdminUser(userId);
      if (res.data?.success) {
        toast.success(res.data.msg || '删除成功');
        fetchData();
      } else {
        toast.error(res.data?.msg || '删除失败');
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const managersCount = users.filter(u => u.role === 'MANAGER').length;
  const staffCount = users.filter(u => u.role === 'STAFF').length;
  const offboardedCount = users.filter(u => u.role === 'OFFBOARDED').length;

  return (
    <div className="space-y-8 pb-10">
      
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">团队人员与权限管理</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">配置内部员工的系统角色与所属门店</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
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
          <button onClick={() => openDrawer()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-lg hover:bg-black transition-all">
            <UserPlus size={18} className="mr-2" /> 录入新员工
          </button>
        </div>
      </div>

      {/* 顶部数据看板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-400">系统总成员</p>
            <p className="text-2xl font-black text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-5">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-400">店长 / 管理者</p>
            <p className="text-2xl font-black text-gray-900">{managersCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-5">
          <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center"><UserCircle size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-400">一线销售顾问</p>
            <p className="text-2xl font-black text-gray-900">{staffCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-5">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><ShieldAlert size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-400">离岗员工</p>
            <p className="text-2xl font-black text-gray-900">{offboardedCount}</p>
          </div>
        </div>
      </div>

      {/* 现代化人员表格 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">成员档案</th>
                <th className="px-6 py-5">角色权限级别</th>
                <th className="px-6 py-5">所属业务门店</th>
                <th className="px-8 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => {
                const userStore = stores.find(s => s.id === user.storeId);
                return (
                <tr key={user.id} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <UserCircle size={24} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm">{user.username}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 flex items-center">
                           <Phone size={10} className="mr-1"/> {user.phone || '未录入手机号'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {user.role === 'MANAGER' ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-black bg-purple-50 text-purple-600 border border-purple-100">
                        <ShieldCheck size={14} className="mr-1.5" /> 门店主理人
                      </span>
                    ) : user.role === 'OFFBOARDED' ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                        <ShieldAlert size={14} className="mr-1.5 opacity-70" /> 离岗员工
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-black bg-slate-50 text-slate-600 border border-slate-200">
                        <ShieldAlert size={14} className="mr-1.5 opacity-70" /> 普通销售
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <Building2 size={16} className={`${user.storeId ? 'text-blue-500' : 'text-gray-300'}`} />
                      <span className={`text-xs font-bold ${user.storeId ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                        {userStore ? userStore.storeName : '暂未指派门店'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right space-x-3">
                    <button onClick={() => openDrawer(user)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                      编辑 / 调岗
                    </button>
                    {user.role !== 'OFFBOARDED' && (
                      <button onClick={() => handleOffboard(user.id)} className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors">
                        下岗
                      </button>
                    )}
                    {user.role === 'OFFBOARDED' && (
                      <>
                        <button onClick={() => handleRestore(user.id)} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
                          恢复
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors">
                          辞退删除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )})}
              {users.length === 0 && (
                <tr><td colSpan="4" className="text-center py-16 text-gray-400 text-sm font-bold">暂无人员数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 核心重构：通过 createPortal 直接把抽屉传送到 body 根节点，绝不被遮挡 */}
      {createPortal(
        <div className={`fixed inset-0 z-[9999] ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          
          {/* 半透明背景遮罩 */}
          <div 
            className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          
          {/* 抽屉主体 */}
          <div className={`absolute inset-y-0 right-0 w-[480px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col border-l border-gray-100 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <h2 className="text-xl font-black text-gray-900">{editingUser ? '编辑员工档案' : '录入新员工'}</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">姓名 / 登录账号 <span className="text-red-500">*</span></label>
                  <input placeholder="如: 张三" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 font-bold text-gray-900" 
                         value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} disabled={editingUser} />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">登录密码</label>
                  <input placeholder={editingUser ? "留空则不修改原密码" : "不填默认密码为 123456"} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20" 
                         type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">联系电话</label>
                  <input placeholder="手机号" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20" 
                         value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="block text-[11px] font-black text-gray-400 mb-3 uppercase">分配角色权限</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setFormData({...formData, role: 'STAFF'})}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.role === 'STAFF' ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                    <ShieldAlert size={20} className={formData.role === 'STAFF' ? 'text-blue-500' : 'text-gray-400'}/>
                    <p className={`font-black mt-2 ${formData.role === 'STAFF' ? 'text-blue-900' : 'text-gray-600'}`}>一线销售</p>
                    <p className="text-[10px] text-gray-400 mt-1">处理线索，录入车辆</p>
                  </button>
                  
                  {isAdmin && (
                    <button onClick={() => setFormData({...formData, role: 'MANAGER'})}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.role === 'MANAGER' ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-500/10' : 'border-gray-100 bg-white hover:border-purple-200'}`}>
                      <ShieldCheck size={20} className={formData.role === 'MANAGER' ? 'text-purple-500' : 'text-gray-400'}/>
                      <p className={`font-black mt-2 ${formData.role === 'MANAGER' ? 'text-purple-900' : 'text-gray-600'}`}>门店店长</p>
                      <p className="text-[10px] text-gray-400 mt-1">最高权限，处理审批</p>
                    </button>
                  )}
                </div>
                {isAdmin && formData.role === 'MANAGER' && <p className="text-[10px] text-purple-500 mt-2 font-bold bg-purple-50 p-2 rounded-lg">注意：系统将自动顶替该门店的原店长</p>}
              </div>

              {/* 🌟 定制化下拉框：自带动态留白 pb-56 防截断，且移除了全屏遮罩层 */}
              <div 
                className={`border-t border-gray-100 pt-6 relative transition-all duration-300 ${storeDropdownOpen ? 'pb-56' : ''}`} 
                ref={storeDropdownRef}
              >
                <label className="block text-[11px] font-black text-gray-400 mb-3 uppercase">派驻业务门店</label>
                
                <div 
                  className={`w-full px-5 py-4 border-2 rounded-2xl cursor-pointer flex justify-between items-center transition-all ${storeDropdownOpen ? 'border-blue-500 bg-white' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}
                  onClick={() => isAdmin && setStoreDropdownOpen(!storeDropdownOpen)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl transition-colors ${formData.storeId ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                      <Building2 size={16} />
                    </div>
                    <span className={`text-sm font-bold ${formData.storeId ? 'text-gray-900' : 'text-gray-400'}`}>
                      {formData.storeId 
                        ? stores.find(s => s.id === parseInt(formData.storeId))?.storeName 
                        : '-- 暂不派驻，作为机动人员 --'}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${storeDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                </div>

                {/* 展开的精美列表 */}
                {isAdmin && storeDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 fade-in">
                    
                    <div 
                      className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors"
                      onClick={() => { setFormData({...formData, storeId: ''}); setStoreDropdownOpen(false); }}
                    >
                      <span className={`text-sm font-bold ${!formData.storeId ? 'text-gray-900' : 'text-gray-400'}`}>-- 暂不派驻 --</span>
                      {!formData.storeId && <Check size={16} className="text-gray-400" />}
                    </div>

                    {stores.map(s => {
                      const isSelected = formData.storeId == s.id;
                      return (
                        <div
                          key={s.id}
                          className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          onClick={() => { setFormData({...formData, storeId: s.id}); setStoreDropdownOpen(false); }}
                        >
                          <div className="flex items-center space-x-3">
                            <MapPin size={16} className={`${isSelected ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-400'}`} />
                            <span className={`text-sm font-bold ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>{s.storeName}</span>
                          </div>
                          {isSelected && <Check size={16} className="text-blue-500" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 bg-white z-0 relative">
              <button onClick={handleSubmit} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-xl hover:bg-black transition-all">
                <Save size={20}/> <span>保存人员档案</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
