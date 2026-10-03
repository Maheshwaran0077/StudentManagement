import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { PlusCircle, Search, Filter } from 'lucide-react';

const STATUSES = ['', 'submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'];
const CATEGORIES = ['', 'Infrastructure','Academic','Hostel','Canteen','Transport',
  'Administrative','Safety','IT/Network','Library','Sports','Medical','Harassment','Financial','Other'];

export default function MyGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [filters, setFilters]       = useState({ status: '', category: '', search: '' });

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (filters.status)   params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search)   params.append('search', filters.search);
      const { data } = await api.get(`/grievances?${params}`);
      setGrievances(data.grievances || []);
      setPages(data.pages || 1);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(page); }, [page, filters]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="My Grievances"
        subtitle="Track all your submitted complaints"
        actions={
          <Link to="/grievances/submit" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> New
          </Link>
        }
      />

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="search" value={filters.search} onChange={handleFilterChange}
              className="input pl-9" placeholder="Search grievances…" />
          </div>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="input sm:w-40">
            {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All status'}</option>)}
          </select>
          <select name="category" value={filters.category} onChange={handleFilterChange} className="input sm:w-44">
            {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All categories'}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <Spinner className="py-12" />
        ) : grievances.length === 0 ? (
          <EmptyState
            title="No grievances found"
            description="Try adjusting your filters or submit a new grievance."
            action={<Link to="/grievances/submit" className="btn-primary">Submit Grievance</Link>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Severity</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Urgency</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grievances.map(g => (
                    <tr key={g._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <Link to={`/grievances/${g._id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1 max-w-[200px] block">
                          {g.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{g.category}</td>
                      <td className="py-3 pr-4"><Badge label={g.severity} variant={g.severity} /></td>
                      <td className="py-3 pr-4"><Badge label={g.status.replace('_', ' ')} variant={g.status} /></td>
                      <td className="py-3 pr-4">
                        {g.aiAnalysis?.urgencyLevel
                          ? <Badge label={g.aiAnalysis.urgencyLevel} variant={g.aiAnalysis.urgencyLevel} />
                          : <span className="text-gray-300 text-xs">Pending</span>}
                      </td>
                      <td className="py-3 text-gray-500 whitespace-nowrap">
                        {new Date(g.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
