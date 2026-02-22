import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🌟 核心：补全 C 端页面导入
import HomePage from './pages/HomePage';
import CarDetail from './pages/CarDetail'; 
import MyOrders from './pages/MyOrders';
import SellCar from './pages/SellCar';

// 🌟 B 端：后台管理组件导入
import AdminLayout from './pages/admin/AdminLayout';
import CarList from './pages/admin/CarList';
import CarForm from './pages/admin/CarForm';
import OrderList from './pages/admin/OrderList'; 
import AdminDashboard from './pages/admin/AdminDashboard'; 
import LeadList from './pages/admin/LeadList';
import StoreList from './pages/admin/StoreList'; // 门店管理
import UserManagement from './pages/admin/UserManagement'; // 人员管理

// 🌟 路由守卫
import ProtectedRoute from './components/ProtectedRoute';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* C 端路由 (保持原样) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/car/:id" element={<CarDetail />} />
        <Route path="/my-orders" element={
          <ProtectedRoute requiredRole="CUSTOMER">
            <MyOrders />
          </ProtectedRoute>
        } />
        <Route path="/sell-car" element={<SellCar />} />
        
        {/* 🌟 B 端：基础要求为 USER 角色 */}
        <Route path="/admin" element={
            <ProtectedRoute requiredRole={["ADMIN", "MANAGER", "STAFF"]}> 
                <AdminLayout />
              </ProtectedRoute>
        }>
          <Route index element={<CarList />} /> 
          <Route path="add" element={<CarForm />} />
          <Route path="edit/:id" element={<CarForm />} />
          <Route path="dashboard" element={<ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="orders" element={<OrderList />} />
          <Route path="leads" element={<LeadList />} /> 

          {/* 🌟 高级管理：要求 MANAGER 角色 */}
          {/* 这里采用了嵌套守卫，只有 MANAGER 才能看到和进入这些子路由 */}
          <Route path="stores" element={
            <ProtectedRoute requiredRole="MANAGER">
              <StoreList />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute requiredRole="MANAGER">
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;