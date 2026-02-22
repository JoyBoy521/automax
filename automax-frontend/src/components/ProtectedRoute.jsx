import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * 🌟 路由守卫：根据角色强制隔离
 * @param requiredRole 该页面要求的角色 ('USER' 去 B 端, 'ADMIN' 去 C 端)
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // 1. 未登录：直接踢回首页（或者你可以弹窗让登录）
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. 角色不符：强制重定向到对应的合法端
  if (userRole !== requiredRole) {
    // 如果你是 ADMIN 想进 B 端，把你踢回 C 端首页
    if (userRole === 'ADMIN' && requiredRole === 'USER') {
      return <Navigate to="/" replace />;
    }
    // 如果你是 USER 想进 C 端，把你踢进 B 端后台
    if (userRole === 'USER' && requiredRole === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}