import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';
import { Search, Eye, Edit3 } from 'lucide-react';

const STATUSES   = ['', 'submitted','under_review','in_progress','resolved','closed','rejected'];
const CATEGORIES = ['','Infrastructure','Academic','Hostel','Canteen','Transport',
  'Administrative','Safety','IT/Network','Library','Sports','Medical','Harassment','Financial','Other'];
const SEVERITIES = ['','low','medium','high','critical'];

export default function AdminGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [filters, setFilters]       = useState({ status:'', category:'', severity:'', search:'' });
  const [editing, setEditing]       = useState(null); // grievance being status-edited
  const [editForm, setEditForm]     = useState({ status:'', adminNotes:'' });
  const [editMsg, setEditMsg]       = useState({ type:'', text:'' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const { data } = await api.get(`/grievances?${params}`);
      setGrievances(data.grievances || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(page); }, [page, filters]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const openEdit = (g) => {
    setEditing(g);
    setEditForm({ status: g.status, adminNotes: g.adminNotes || '' });
    setEditMsg({ type: '', text: '' });
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await api.put(`/grievances/${editing._id}/status`, editForm);
      setEditMsg({ type: 'success', text: 'Status updated.' });
      fetchData(page);
      setTimeout(() => setEditing(null), 1200);
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally { setEditLoading(false); }
  };

  return (
    <div>
      <PageHeader title="All Grievances" subtitle={`${total} total records`} />

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="search" value={filters.search} onChange={handleFilterChange}
              className="input pl-9" placeholder="Search…" />
          </div>
          {[['status', STATUSES], ['category', CATEGORIES], ['severity', SEVERITIES]].map(([name, opts]) => (
            <select key={name} name={name} value={filters[name]} onChange={handleFilterChange} className="input w-36">
              {opts.map(o => <option key={o} value={o}>{o || `All ${name}s`}</option>)}
            </select>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner className="py-12" /> : grievances.length === 0 ? (
          <EmptyState title="No grievances found" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {['Title','Submitted By','Category','Severity','Status','Urgency','Date','Actions'].map(h => (
                      <th key={h} className="pb-3 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grievances.map(g => (
                    <tr key={g._id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 max-w-[180px]">
                        <p className="font-medium text-gray-900 line-clamp-1">{g.title}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-gray-700">{g.submittedBy?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{g.submittedBy?.role}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{g.category}</td>
                      <td className="py-3 pr-4"><Badge label={g.severity} variant={g.severity} /></td>
                      <td className="py-3 pr-4"><Badge label={g.status.replace('_',' ')} variant={g.status} /></td>
                      <td className="py-3 pr-4">
                        {g.aiAnalysis?.urgencyLevel
                          ? <Badge label={g.aiAnalysis.urgencyLevel} variant={g.aiAnalysis.urgencyLevel} />
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {new Date(g.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/grievances/${g._id}`} className="text-gray-400 hover:text-primary-600">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => openEdit(g)} className="text-gray-400 hover:text-primary-600">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Edit status modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Update Grievance Status">
        {editMsg.text && <Alert type={editMsg.type} message={editMsg.text} onClose={() => setEditMsg({ type:'', text:'' })} />}
        <div className="space-y-4 mt-3">
          <div>
            <label className="label">Status</label>
            <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="input">
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Admin Notes</label>
            <textarea rows={3} value={editForm.adminNotes}
              onChange={e => setEditForm(p => ({ ...p, adminNotes: e.target.value }))}
              className="input resize-none" placeholder="Optional note to the submitter…" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleEditSave} disabled={editLoading} className="btn-primary flex-1">
              {editLoading ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
