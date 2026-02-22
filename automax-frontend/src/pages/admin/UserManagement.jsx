import React, { useState, useEffect } from 'react';
import { UserCircle, Shield, Building2, UserPlus, Mail } from 'lucide-react';
import { getAdminUserList, getStoreList, updateUserRole } from '../../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [uRes, sRes] = await Promise.all([getAdminUserList(), getStoreList()]);
    setUsers(uRes.data.data);
    setStores(sRes.data.data);
  };

  const handleRoleUpdate = async (userId, storeId, role) => {
    await updateUserRole({ userId, storeId, role });
    alert("权限更新成功！");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900">团队人员与权限</h1>
        <div className="text-xs text-gray-400 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
           当前系统共有 {users.length} 名成员
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-50">
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-6">成员账号 / 身份</th>
              <th className="px-6 py-6">所属门店绑定</th>
              <th className="px-6 py-6">角色权限级别</th>
              <th className="px-8 py-6 text-right">安全操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-8 py-6 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserCircle/></div>
                  <div>
                    <p className="font-bold text-gray-900">{user.username}</p>
                    <p className="text-[10px] text-gray-400">UID: {user.id}</p>
                  </div>
                </td>
                <td className="px-6 py-6">
                   <select 
                    className="bg-gray-50 border-none text-xs font-bold rounded-lg px-2 py-1 outline-none"
                    value={user.storeId || ""}
                    onChange={(e) => handleRoleUpdate(user.id, e.target.value, user.role)}
                   >
                     <option value="">未分配门店</option>
                     {stores.map(s => <option key={s.id} value={s.id}>{s.storeName}</option>)}
                   </select>
                </td>
                <td className="px-6 py-6">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${user.role === 'MANAGER' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {user.role === 'MANAGER' ? '店长 / 系统管理员' : '普通销售顾问'}
                   </span>
                </td>
                <td className="px-8 py-6 text-right">
                   <button 
                    onClick={() => handleRoleUpdate(user.id, user.storeId, user.role === 'USER' ? 'MANAGER' : 'USER')}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                   >
                      切换为 {user.role === 'USER' ? '管理员' : '普通成员'}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}