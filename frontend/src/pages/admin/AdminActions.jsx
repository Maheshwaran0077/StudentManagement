import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { Eye, Clock } from 'lucide-react';

const APPROVAL_STATUSES = ['','pending','approved','rejected','edited_approved'];
const ACTION_STATUSES   = ['','pending_approval','approved','in_progress','completed','cancelled'];

export default function AdminActions() {
  const [actions, setActions]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [filters, setFilters]   = useState({ approvalStatus:'pending', status:'' });

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
      if (filters.status)         params.append('status', filters.status);
      const { data } = await api.get(`/actions?${params}`);
      setActions(data.actions || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(page); }, [page, filters]);

  return (
    <div>
      <PageHeader title="Actions" subtitle={`${total} total actions`} />

      <div className="card mb-4">
        <div className="flex gap-3 flex-wrap">
          <select value={filters.approvalStatus}
            onChange={e => { setFilters(p=>({...p, approvalStatus:e.target.value})); setPage(1); }}
            className="input w-44">
            {APPROVAL_STATUSES.map(s=><option key={s} value={s}>{s||'All approval status'}</option>)}
          </select>
          <select value={filters.status}
            onChange={e => { setFilters(p=>({...p, status:e.target.value})); setPage(1); }}
            className="input w-44">
            {ACTION_STATUSES.map(s=><option key={s} value={s}>{s||'All status'}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner className="py-12" /> : actions.length === 0 ? (
          <EmptyState title="No actions found" description="Generate actions from pattern details." />
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {actions.map(a => (
                <Link key={a._id} to={`/admin/actions/${a._id}`}
                  className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 rounded-lg transition-colors group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{a.actionId}</span>
                      <Badge label={a.approvalStatus} variant={a.approvalStatus} />
                      <Badge label={a.status.replace('_',' ')} variant={a.status} />
                      {a.recommendation?.priority && (
                        <Badge label={`P: ${a.recommendation.priority}`} variant={a.recommendation.priority} />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 truncate group-hover:text-primary-700">{a.title}</p>
                    {a.patternId && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pattern: {a.patternId.title} · {a.patternId.category}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0 text-gray-400">
                    {a.deadline && (
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(a.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <Eye className="w-4 h-4 group-hover:text-primary-500" />
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
