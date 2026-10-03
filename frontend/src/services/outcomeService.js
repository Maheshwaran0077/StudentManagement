import api from './api';

export const measureOutcome = (actionId, data) => api.post(`/outcomes/measure/${actionId}`, data);
export const getOutcomes    = ()               => api.get('/outcomes');
export const getOutcomeById = (id)             => api.get(`/outcomes/${id}`);
