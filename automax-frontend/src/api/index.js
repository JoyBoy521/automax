import axios from 'axios';

// 🌟 统一使用 api 变量名
const api = axios.create({
  baseURL: 'http://localhost:8080/api', 
  timeout: 5000
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
    alert("会话已过期，请重新登录");
    localStorage.clear();
    window.location.href = "/"; 
  } else if (error.response?.status === 403) {
    alert("⛔ 权限不足！");
  }
  return Promise.reject(error);
});

// 🌟 核心修复：将所有的 request 替换为 api
export const login = (data) => api.post('/auth/login', data);
export const getCarDetail = (id) => api.get(`/cars/detail/${id}`);
export const getCarList = (params) => api.get('/cars/list', { params });
export const createOrder = (data) => api.post('/orders/lock', data);
export const addCar = (data) => api.post('/admin/cars/add', data);
export const getAdminOrderList = () => api.get(`/orders/admin/list`);
export const updateOrderStatus = (id, status) => api.put(`/orders/admin/${id}/status?status=${status}`);
export const cancelOrder = (id) => api.put(`/orders/cancel/${id}`);
export const getSpuList = () => api.get('/cars/spu/list');
export const submitSellLead = (data) => api.post('/leads/submit', data);
export const getLeadList = () => api.get('/admin/leads/list');
export const updateLeadStatus = (id, status) => api.put(`/admin/leads/${id}/status?status=${status}`);

// 🌟 这里之前报错的地方
export const getStoreList = () => api.get('/admin/stores/list');
export const saveStore = (data) => api.post('/admin/stores/save', data);
export const deleteStore = (id) => api.delete(`/admin/stores/${id}`);

export const getAdminUserList = () => api.get('/admin/users/list');
export const updateUserRole = (data) => api.post('/admin/users/updateRole', data);

export const getCandidateManagers = () => api.get('/admin/stores/candidates');
export const bindStoreManager = (data) => api.post('/admin/stores/bind-manager', data);

export default api;