import api from './api';

export const runPatternDiscovery = ()       => api.post('/patterns/discover');
export const getPatterns         = (params) => api.get('/patterns', { params });
export const getPatternById      = (id)     => api.get(`/patterns/${id}`);
export const runDiagnosis        = (id)     => api.post(`/patterns/${id}/diagnose`);
export const runPrediction       = (id)     => api.post(`/patterns/${id}/predict`);
export const semanticSearch      = (query)  => api.post('/search/semantic', { query });
