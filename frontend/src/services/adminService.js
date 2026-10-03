import api from './api';

export const getDashboardStats  = ()          => api.get('/admin/dashboard');
export const getUsers           = (params)    => api.get('/admin/users', { params });
export const changeUserRole     = (id, role)  => api.put(`/admin/users/${id}/role`, { role });
export const toggleUserActive   = (id)        => api.put(`/admin/users/${id}/toggle-active`);
export const getDepartments     = ()          => api.get('/departments');
export const createDepartment   = (data)      => api.post('/departments', data);
export const updateDepartment   = (id, data)  => api.put(`/departments/${id}`, data);
export const getAuditLogs       = (params)    => api.get('/audit', { params });
