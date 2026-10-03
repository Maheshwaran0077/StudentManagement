import { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { ClipboardList } from 'lucide-react';

const ACTION_COLORS = {
  GRIEVANCE_SUBMITTED: 'bg-blue-100 text-blue-700',
  GRIEVANCE_STATUS_CHANGED: 'bg-yellow-100 text-yellow-700',
  GRIEVANCE_DELETED: 'bg-red-100 text-red-700',
  PATTERN_DISCOVERED: 'bg-purple-100 text-purple-700',
  ACTION_APPROVED: 'bg-green-100 text-green-700',
  ACTION_REJECTED: 'bg-red-100 text-red-700',
  ACTION_COMPLETED: 'bg-teal-100 text-teal-700',
  OUTCOME_MEASURED: 'bg-indigo-100 text-indigo-700',
  SENSITIVE_DATA_ACCESSED: 'bg-orange-100 text-orange-700',
  USER_LOGIN: 'bg-gray-100 text-gray-600',
  USER_REGISTERED: 'bg-sky-100 text-sky-700',
  USER_ROLE_CHANGED: 'bg-amber-100 text-amber-700',
};

export default function AdminAuditLog() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 30 });
      if (filterAction) params.append('action', filterAction);
      const { data } = await api.get(`/audit?${params}`);
      setLogs(data.logs || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(page); }, [page, filterAction]);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle={`${total} total audit entries`} />

      <div className="card mb-4">
        <select value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(1); }}
          className="input w-64">
          <option value="">All actions</option>
          {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <Spinner className="py-12" /> : logs.length === 0 ? (
          <EmptyState title="No audit logs" description="Actions performed by admins will appear here." />
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {logs.map(log => (
                <div key={log._id} className="flex items-start gap-4 py-3">
                  <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action.replace(/_/g,' ')}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{log.performedBy?.name}</span>
                      <span className="text-xs text-gray-400 capitalize">({log.performedBy?.role})</span>
                    </div>
                    {log.targetResource && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Resource: {log.targetResource} {log.targetId ? `· ${log.targetId}` : ''}
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
