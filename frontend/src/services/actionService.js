import api from './api';

export const generateActionRecommendation = (patternId) => api.post(`/actions/recommend/${patternId}`);
export const getActions                   = (params)     => api.get('/actions', { params });
export const getActionById                = (id)         => api.get(`/actions/${id}`);
export const approveAction                = (id, data)   => api.put(`/actions/${id}/approve`, data);
export const rejectAction                 = (id, data)   => api.put(`/actions/${id}/reject`, data);
export const addProgressUpdate            = (id, data)   => api.put(`/actions/${id}/progress`, data);
