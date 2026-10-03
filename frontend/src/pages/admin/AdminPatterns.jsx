import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import { Network, RefreshCw, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TrendIcon = ({ trend }) => {
  if (trend === 'increasing' || trend === 'emerging') return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export default function AdminPatterns() {
  const [patterns, setPatterns]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [discovering, setDiscovering] = useState(false);
  const [discoverMsg, setDiscoverMsg] = useState({ type:'', text:'' });
  const [filters, setFilters]       = useState({ status:'', category:'' });

  const fetchPatterns = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (filters.status)   params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      const { data } = await api.get(`/patterns?${params}`);
      setPatterns(data.patterns || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPatterns(page); }, [page, filters]);

  const runDiscovery = async () => {
    setDiscovering(true);
    setDiscoverMsg({ type:'', text:'' });
    try {
      const { data } = await api.post('/patterns/discover');
      setDiscoverMsg({ type:'success', text: data.message });
      fetchPatterns(1);
    } catch (err) {
      setDiscoverMsg({ type:'error', text: err.response?.data?.message || 'Discovery failed.' });
    } finally { setDiscovering(false); }
  };

  return (
    <div>
      <PageHeader
        title="Patterns"
        subtitle={`${total} discovered patterns`}
        actions={
          <button onClick={runDiscovery} disabled={discovering} className="btn-primary">
            {discovering ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            {discovering ? 'Discovering…' : 'Run Pattern Discovery'}
          </button>
        }
      />

      {discoverMsg.text && (
        <Alert type={discoverMsg.type} message={discoverMsg.text} onClose={() => setDiscoverMsg({type:'',text:''})} />
      )}

      {/* Filters */}
      <div className="card my-4">
        <div className="flex gap-3 flex-wrap">
          <select value={filters.status} onChange={e => { setFilters(p=>({...p,status:e.target.value})); setPage(1); }} className="input w-36">
            {['','active','resolved','monitoring','archived'].map(s=>(
              <option key={s} value={s}>{s||'All status'}</option>
            ))}
          </select>
          <select value={filters.category} onChange={e => { setFilters(p=>({...p,category:e.target.value})); setPage(1); }} className="input w-44">
            {['','Infrastructure','Academic','Hostel','Canteen','Transport','Administrative',
              'Safety','IT/Network','Library','Sports','Medical','Harassment','Financial','Other'].map(c=>(
              <option key={c} value={c}>{c||'All categories'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner className="py-12" /> : patterns.length === 0 ? (
          <EmptyState
            title="No patterns yet"
            description="Run pattern discovery to find clusters of similar grievances."
            action={<button onClick={runDiscovery} className="btn-primary">Run Discovery</button>}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {patterns.map(p => (
                <Link key={p._id} to={`/admin/patterns/${p._id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition-colors group">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-2 bg-primary-100 rounded-lg shrink-0">
                      <Network className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-primary-700">{p.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.grievanceCount} grievances · {p.category}{p.location ? ` · ${p.location}` : ''}
                      </p>
                      {p.keywords?.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-1.5">
                          {p.keywords.slice(0, 5).map(kw => (
                            <span key={kw} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {p.prediction?.trend && (
                      <div className="flex items-center gap-1">
                        <TrendIcon trend={p.prediction.trend} />
                        <Badge label={p.prediction.trend} variant={p.prediction.trend} />
                      </div>
                    )}
                    <Badge label={p.status} variant={p.status} />
                    <Eye className="w-4 h-4 text-gray-300 group-hover:text-primary-500" />
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
