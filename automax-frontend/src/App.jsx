import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, cssTransition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🌟 核心：补全 C 端页面导入
import HomePage from './pages/HomePage';
import CarDetail from './pages/CarDetail'; 
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import SellCar from './pages/SellCar';
import AboutPage from './pages/AboutPage';

// 🌟 B 端：后台管理组件导入
import AdminLayout from './pages/admin/AdminLayout';
import CarList from './pages/admin/CarList';
import CarForm from './pages/admin/CarForm';
import OrderList from './pages/admin/OrderList'; 
import AdminDashboard from './pages/admin/AdminDashboard'; 
import LeadList from './pages/admin/LeadList';
import StoreList from './pages/admin/StoreList'; // 门店管理
import UserManagement from './pages/admin/UserManagement'; // 人员管理
import SearchCarsPage from './pages/SearchCarsPage';
// 🌟 路由守卫
import ProtectedRoute from './components/ProtectedRoute';

const islandTransition = cssTransition({
  enter: 'island-drop-enter',
  exit: 'island-drop-exit',
  collapse: false
});

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-center"
        autoClose={3200}
        closeButton={false}
        hideProgressBar
        pauseOnHover
        draggable={false}
        newestOnTop
        limit={3}
        transition={islandTransition}
        toastClassName="rounded-full bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl min-h-[52px] px-3"
        bodyClassName="p-0 text-white"
      />
      <Routes>
        {/* C 端路由 (保持原样) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/car/:id" element={<CarDetail />} />
        <Route path="/my-orders" element={
          <ProtectedRoute requiredRole={["CUSTOMER", "ADMIN"]}>
            <MyOrders />
          </ProtectedRoute>
        } />
        <Route path="/my-orders/:id" element={
          <ProtectedRoute requiredRole={["CUSTOMER", "ADMIN"]}>
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/sell-car" element={<SellCar />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/search-cars" element={<SearchCarsPage />} />
        {/* B 端：基础要求为内部角色 */}
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

          {/* 门店管理：仅 ADMIN */}
          <Route path="stores" element={
            <ProtectedRoute requiredRole="ADMIN">
              <StoreList />
            </ProtectedRoute>
          } />
          {/* 人员管理：ADMIN / MANAGER */}
          <Route path="users" element={
            <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
