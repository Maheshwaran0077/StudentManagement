import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import {
  ArrowLeft, Brain, Stethoscope, TrendingUp,
  Zap, MapPin, Tag, Users, Calendar,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function PatternDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pattern, setPattern]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState('');
  const [msg, setMsg]             = useState({ type:'', text:'' });

  const fetchPattern = () => {
    api.get(`/patterns/${id}`)
      .then(({ data }) => setPattern(data.pattern))
      .catch(() => setMsg({ type:'error', text:'Pattern not found.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPattern(); }, [id]);

  const runAgent = async (endpoint, label) => {
    setBusy(label);
    setMsg({ type:'', text:'' });
    try {
      const { data } = await api.post(`/patterns/${id}/${endpoint}`);
      setMsg({ type:'success', text: `${label} completed.` });
      fetchPattern();
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || `${label} failed.` });
    } finally { setBusy(''); }
  };

  const generateAction = async () => {
    setBusy('action');
    setMsg({ type:'', text:'' });
    try {
      const { data } = await api.post(`/actions/recommend/${id}`);
      setMsg({ type:'success', text: 'Action recommendation generated.' });
      navigate(`/admin/actions/${data.action._id}`);
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Action generation failed.' });
    } finally { setBusy(''); }
  };

  if (loading) return <Spinner className="py-20" />;
  if (!pattern && msg.text) return <div className="p-8"><Alert type="error" message={msg.text} /></div>;
  if (!pattern) return null;

  const trendData = (pattern.weeklyTrend || []).map(w => ({ week: w.week, count: w.count }));
  const forecastData = (pattern.prediction?.forecast || []).map(f => ({
    week: f.week, predicted: f.predicted, lower: f.lower, upper: f.upper,
  }));
  const chartData = [...trendData, ...forecastData];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={pattern.title}
        actions={
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {msg.text && <Alert type={msg.type} message={msg.text} onClose={() => setMsg({type:'',text:''})} />}

      {/* Meta */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <Badge label={pattern.status} variant={pattern.status} />
          {pattern.severity && <Badge label={pattern.severity} variant={pattern.severity} />}
          {pattern.sentiment && <Badge label={pattern.sentiment} variant={pattern.sentiment} />}
          {pattern.prediction?.trend && <Badge label={pattern.prediction.trend} variant={pattern.prediction.trend} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">{pattern.description}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Tag className="w-4 h-4 text-gray-400" />
            <span>{pattern.category}</span>
          </div>
          {pattern.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{pattern.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{pattern.grievanceCount} grievances</span>
          </div>
          {pattern.peakPeriod && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Peak: {pattern.peakPeriod}</span>
            </div>
          )}
        </div>
        {pattern.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {pattern.keywords.map(kw => (
              <span key={kw} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* AI Agent buttons */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">AI Analysis Pipeline</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => runAgent('diagnose', 'Diagnose')} disabled={!!busy}
            className="btn-secondary gap-2">
            <Stethoscope className="w-4 h-4" />
            {busy === 'Diagnose' ? 'Diagnosing…' : 'Run Diagnosis'}
          </button>
          <button onClick={() => runAgent('predict', 'Predict')} disabled={!!busy}
            className="btn-secondary gap-2">
            <TrendingUp className="w-4 h-4" />
            {busy === 'Predict' ? 'Predicting…' : 'Run Prediction'}
          </button>
          <button onClick={generateAction} disabled={!!busy || !!pattern.actionId}
            className="btn-primary gap-2">
            <Zap className="w-4 h-4" />
            {busy === 'action' ? 'Generating…' : pattern.actionId ? 'Action Created' : 'Generate Action'}
          </button>
          {pattern.actionId && (
            <Link to={`/admin/actions/${pattern.actionId._id || pattern.actionId}`}
              className="btn-secondary gap-2">
              <Zap className="w-4 h-4" /> View Action
            </Link>
          )}
        </div>
      </div>

      {/* Trend + Forecast chart */}
      {chartData.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Trend & Forecast</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top:5, right:10, left:-10, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
          {pattern.prediction && (
            <div className="flex gap-6 mt-3 text-xs text-gray-500">
              <span>Slope: {pattern.prediction.slope?.toFixed(3)}</span>
              <span>R²: {pattern.prediction.rSquared?.toFixed(3)}</span>
              <span>Growth Rate: {pattern.prediction.growthRate?.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Diagnosis */}
      {pattern.diagnosis && (
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Diagnosis</h3>
            <Badge label={pattern.diagnosis.confidenceLevel} variant={pattern.diagnosis.confidenceLevel} />
          </div>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{pattern.diagnosis.evidenceSummary}</p>
          <ul className="space-y-2">
            {pattern.diagnosis.possibleCauses.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
