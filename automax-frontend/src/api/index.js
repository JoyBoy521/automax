import axios from 'axios';
import { toast } from 'react-toastify';

const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, '');

  // 开发环境优先走 Vite 代理，规避 CORS 和固定 localhost 问题
  if (import.meta.env.DEV) return '/api';

  // 生产环境兜底：跟随当前域名，仅固定后端端口
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8080/api`;
  }
  return 'http://localhost:8080/api';
};

// 🌟 统一使用 api 变量名
const api = axios.create({
  baseURL: resolveApiBase(),
  timeout: 8000
});

// 🌟 请求拦截器：自动注入 Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token; 
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 🌟 响应拦截器：处理 401 和 403
api.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response?.status === 401) {
    toast.error("会话已过期，请重新登录");
    localStorage.clear();
    window.location.href = "/"; 
  } else if (error.response?.status === 403) {
    toast.error("权限不足");
  }
  return Promise.reject(error);
});

// 🌟 核心修复：将所有的 request 替换为 api
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getCarDetail = (id) => api.get(`/cars/detail/${id}`);
export const getCarList = (params) => api.get('/cars/list', { params });
export const createOrder = (data) => api.post('/orders/lock', data);
export const addCar = (data) => api.post('/admin/cars/add', data);
export const getAdminCarList = (params) => api.get('/admin/cars/list', { params });
export const deleteAdminCar = (id) => api.delete(`/admin/cars/${id}`);
export const getAdminOrderList = (params) => api.get(`/orders/admin/list`, { params });
export const getMyOrderList = () => api.get(`/orders/my/list`);
export const getMyOrderDetail = (id) => api.get(`/orders/my/${id}`);
export const saveMyAppointment = (id, data) => api.put(`/orders/my/${id}/appointment`, data);
export const updateOrderStatus = (id, status) => api.put(`/orders/admin/${id}/status?status=${status}`);
export const cancelOrder = (id) => api.put(`/orders/cancel/${id}`);
export const getSpuList = () => api.get('/cars/spu/list');
export const submitSellLead = (data) => api.post('/leads/submit', data);
export const getLeadList = (params) => api.get('/admin/leads/list', { params });
export const updateLeadStatus = (id, status) => api.put(`/admin/leads/${id}/status?status=${status}`);

// 🌟 这里之前报错的地方
export const getStoreList = () => api.get('/admin/stores/list');
export const saveStore = (data) => api.post('/admin/stores/save', data);
export const deleteStore = (id) => api.delete(`/admin/stores/${id}`);

export const getAdminUserList = (params) => api.get('/admin/users/list', { params });
export const updateUserRole = (data) => api.post('/admin/users/updateRole', data);
export const offboardAdminUser = (userId) => api.post('/admin/users/offboard', { userId });
export const restoreAdminUser = (userId) => api.post('/admin/users/restore', { userId });
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

export const getCandidateManagers = () => api.get('/admin/stores/candidates');
export const bindStoreManager = (data) => api.post('/admin/stores/bind-manager', data);
export const saveAdminUser = (data) => api.post('/admin/users/save', data);
export const getDashboardStats = (params) => api.get('/admin/dashboard/stats', { params });

export const getApiErrorMessage = (err, fallback = '请求失败') => {
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.msg || err?.response?.data?.message;
  if (serverMsg) return serverMsg;
  if (!err?.response) return '无法连接服务器，请确认后端服务(8080)已启动';
  if (status >= 500) return '服务器内部错误，请稍后重试';
  if (status === 404) return '接口不存在，请检查前后端地址配置';
  return fallback;
};

export default api;
