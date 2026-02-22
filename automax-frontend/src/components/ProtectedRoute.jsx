import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * 路由守卫：支持单角色或多角色
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const normalizedRole = userRole === 'USER' ? 'STAFF' : userRole;
  const internalRoles = ['ADMIN', 'MANAGER', 'STAFF'];

  // 1. 未登录：直接踢回首页（或者你可以弹窗让登录）
  if (!token) {
    return <Navigate to="/" replace />;
  }

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!requiredRoles.includes(normalizedRole)) {
    // 后台角色回各自默认页：员工回车辆列表，管理角色回看板
    if (internalRoles.includes(normalizedRole)) {
      return <Navigate to={normalizedRole === 'STAFF' ? '/admin' : '/admin/dashboard'} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
