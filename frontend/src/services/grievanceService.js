import api from './api';

export const submitGrievance      = (data)         => api.post('/grievances', data);
export const getMyGrievances      = (params)        => api.get('/grievances', { params });
export const getAllGrievances      = (params)        => api.get('/grievances', { params });
export const getGrievanceById     = (id)            => api.get(`/grievances/${id}`);
export const updateGrievanceStatus = (id, data)     => api.put(`/grievances/${id}/status`, data);
export const deleteGrievance      = (id)            => api.delete(`/grievances/${id}`);
export const getGrievanceStats    = ()              => api.get('/grievances/stats');
export const searchGrievances     = (params)        => api.get('/search/grievances', { params });
