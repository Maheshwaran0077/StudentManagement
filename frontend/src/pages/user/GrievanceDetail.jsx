import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import { ArrowLeft, Tag, MapPin, Building2, Clock, Brain, AlertTriangle, RefreshCw } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => value ? (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  </div>
) : null;

export default function GrievanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get(`/grievances/${id}`)
      .then(({ data }) => setGrievance(data.grievance))
      .catch(() => setError('Grievance not found or access denied.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner className="py-20" />;
  if (error)   return <div className="py-20"><Alert type="error" message={error} /></div>;
  if (!grievance) return null;

  const ai = grievance.aiAnalysis;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Grievance Details"
        actions={
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <div className="card mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{grievance.title}</h2>
          <div className="flex gap-2 shrink-0">
            <Badge label={grievance.status.replace('_', ' ')} variant={grievance.status} />
            <Badge label={grievance.severity} variant={grievance.severity} />
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 pb-5 border-b border-gray-100">
          <InfoRow icon={Tag}       label="Category"   value={grievance.category} />
          <InfoRow icon={Tag}       label="Sub-category" value={grievance.subCategory} />
          <InfoRow icon={MapPin}    label="Location"   value={grievance.location} />
          <InfoRow icon={Building2} label="Department" value={grievance.department?.name} />
          <InfoRow icon={Clock}     label="Submitted"  value={new Date(grievance.createdAt).toLocaleString()} />
          {grievance.resolvedAt && (
            <InfoRow icon={Clock} label="Resolved" value={new Date(grievance.resolvedAt).toLocaleString()} />
          )}
        </div>

        {/* Description */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{grievance.description}</p>
        </div>

        {/* Admin notes */}
        {grievance.adminNotes && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">Admin Notes</p>
            <p className="text-sm text-blue-900">{grievance.adminNotes}</p>
          </div>
        )}
      </div>

      {/* AI Analysis */}
      {ai && ai.analyzedAt ? (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">AI Analysis</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <p className="text-xs text-gray-400">Sentiment</p>
              <div className="mt-1"><Badge label={ai.sentiment} variant={ai.sentiment} /></div>
              <p className="text-xs text-gray-500 mt-1">Score: {ai.sentimentScore?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Urgency</p>
              <div className="mt-1"><Badge label={ai.urgencyLevel} variant={ai.urgencyLevel} /></div>
              <p className="text-xs text-gray-500 mt-1">Score: {ai.urgencyScore?.toFixed(1)}/10</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Flags</p>
              <div className="mt-1 flex flex-col gap-1">
                {ai.isSafetyConcern && <Badge label="Safety Concern" variant="critical" />}
                {ai.isRecurrence && <Badge label="Recurrence" variant="warning" />}
                {!ai.isSafetyConcern && !ai.isRecurrence && <span className="text-xs text-gray-400">None</span>}
              </div>
            </div>
          </div>

          {ai.keywords?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Extracted Keywords</p>
              <div className="flex flex-wrap gap-2">
                {ai.keywords.map(kw => (
                  <span key={kw} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {ai.recurrenceSignals?.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Recurrence signals: {ai.recurrenceSignals.join(', ')}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card flex items-center gap-3 text-gray-500 text-sm">
          <Brain className="w-5 h-5 text-gray-300" />
          AI analysis is being processed. Check back shortly.
        </div>
      )}
    </div>
  );
}
