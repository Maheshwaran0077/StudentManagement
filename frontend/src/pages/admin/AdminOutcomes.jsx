import { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { TrendingDown, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';

export default function AdminOutcomes() {
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/outcomes')
      .then(({ data }) => setOutcomes(data.outcomes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Outcomes & Recurrence" subtitle="Effectiveness of completed actions" />

      {loading ? <Spinner className="py-12" /> : outcomes.length === 0 ? (
        <div className="card">
          <EmptyState title="No outcomes yet" description="Measure outcomes after completing actions." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {outcomes.map(o => {
            const improved = o.improvementRate > 0;
            return (
              <div key={o._id} className="card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">{o.actionId?.title || 'Action'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Pattern: {o.patternId?.title || '—'} · {o.patternId?.category || ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge label={o.verdict} variant={o.verdict} />
                    {o.recurrenceDetected && <Badge label="Recurrence!" variant="critical" />}
                  </div>
                </div>

                {/* Before / After comparison */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-600 mb-2">BEFORE</p>
                    <div className="space-y-1 text-xs text-red-800">
                      <p>Complaints: <strong>{o.before?.grievanceCount}</strong></p>
                      <p>Avg Severity: <strong>{o.before?.avgSeverityScore?.toFixed(2)}</strong></p>
                      <p>Avg Sentiment: <strong>{o.before?.avgSentimentScore?.toFixed(3)}</strong></p>
                      <p>Weekly Freq: <strong>{o.before?.weeklyFrequency?.toFixed(1)}</strong></p>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-600 mb-2">AFTER</p>
                    <div className="space-y-1 text-xs text-green-800">
                      <p>Complaints: <strong>{o.after?.grievanceCount}</strong></p>
                      <p>Avg Severity: <strong>{o.after?.avgSeverityScore?.toFixed(2)}</strong></p>
                      <p>Avg Sentiment: <strong>{o.after?.avgSentimentScore?.toFixed(3)}</strong></p>
                      <p>Weekly Freq: <strong>{o.after?.weeklyFrequency?.toFixed(1)}</strong></p>
                    </div>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="flex flex-wrap items-center gap-6 text-sm border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    {improved ? <TrendingDown className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-red-500" />}
                    <span className={improved ? 'text-green-700' : 'text-red-700'}>
                      {improved ? '↓' : '↑'} {Math.abs(o.improvementRate?.toFixed(1))}% complaint change
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Effectiveness: <strong>{o.effectivenessScore?.toFixed(0)}/100</strong></span>
                  </div>
                  {o.recurrenceDetected && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <RefreshCw className="w-4 h-4" />
                      <span>Recurrence Score: {(o.recurrenceScore * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  <span className="text-gray-400 text-xs ml-auto">
                    Measured: {o.measuredAt ? new Date(o.measuredAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
