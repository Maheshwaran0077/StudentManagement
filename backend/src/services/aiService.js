const axios = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const aiClient = axios.create({
  baseURL: AI_URL,
  timeout: 60000,
});

/**
 * Analyze a single grievance through the AI pipeline.
 */
const analyzeGrievance = async (grievanceData) => {
  const { data } = await aiClient.post('/api/analyze', grievanceData);
  return data;
};

/**
 * Trigger pattern discovery on completed/resolved grievances.
 */
const discoverPatterns = async (payload) => {
  const { data } = await aiClient.post('/api/patterns/discover', payload);
  return data;
};

/**
 * Run diagnosis on a discovered pattern.
 */
const diagnosePattern = async (patternData) => {
  const { data } = await aiClient.post('/api/diagnose', patternData);
  return data;
};

/**
 * Predict trend for a pattern.
 */
const predictPattern = async (patternData) => {
  const { data } = await aiClient.post('/api/predict', patternData);
  return data;
};

/**
 * Generate recommendation for an action.
 */
const generateRecommendation = async (payload) => {
  const { data } = await aiClient.post('/api/recommend', payload);
  return data;
};

/**
 * Generate action draft.
 */
const coordinateAction = async (payload) => {
  const { data } = await aiClient.post('/api/actions/coordinate', payload);
  return data;
};

/**
 * Measure outcome and check recurrence.
 */
const measureOutcome = async (payload) => {
  const { data } = await aiClient.post('/api/outcomes/measure', payload);
  return data;
};

/**
 * Semantic search using natural language query.
 */
const semanticSearch = async (query, candidates) => {
  const { data } = await aiClient.post('/api/search/semantic', { query, candidates });
  return data;
};

module.exports = {
  analyzeGrievance,
  discoverPatterns,
  diagnosePattern,
  predictPattern,
  generateRecommendation,
  coordinateAction,
  measureOutcome,
  semanticSearch,
};
