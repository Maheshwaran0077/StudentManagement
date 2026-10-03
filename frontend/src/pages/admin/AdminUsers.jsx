import { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';
import { Search, Edit3, UserCheck, UserX } from 'lucide-react';

const ROLES = ['student','faculty','staff','admin','sensitive_officer'];

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [filters, setFilters]   = useState({ role:'', search:'' });
  const [editing, setEditing]   = useState(null);
  const [newRole, setNewRole]   = useState('');
  const [msg, setMsg]           = useState({ type:'', text:'' });
  const [saving, setSaving]     = useState(false);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (filters.role)   params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setPages(Math.ceil((data.total || 0) / 20));
      setTotal(data.total || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(page); }, [page, filters]);

  const openEditRole = (user) => { setEditing(user); setNewRole(user.role); setMsg({ type:'', text:'' }); };

  const handleRoleChange = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${editing._id}/role`, { role: newRole });
      setMsg({ type:'success', text:'Role updated.' });
      fetchData(page);
      setTimeout(() => setEditing(null), 1000);
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Failed.' });
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}/toggle-active`);
      fetchData(page);
    } catch (_) {}
  };

  const ROLE_COLORS = {
    student: 'bg-blue-100 text-blue-700', faculty: 'bg-purple-100 text-purple-700',
    staff: 'bg-gray-100 text-gray-700', admin: 'bg-red-100 text-red-700',
    sensitive_officer: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${total} registered users`} />

      <div className="card mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="search" value={filters.search}
              onChange={e => { setFilters(p=>({...p,search:e.target.value})); setPage(1); }}
              className="input pl-9" placeholder="Search by name or email…" />
          </div>
          <select value={filters.role}
            onChange={e => { setFilters(p=>({...p,role:e.target.value})); setPage(1); }}
            className="input w-44">
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner className="py-12" /> : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {['Name','Email','Role','Department','Status','Joined','Actions'].map(h=>(
                      <th key={h} className="pb-3 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u._id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 text-xs">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{u.department?.name || '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge label={u.isActive ? 'Active' : 'Inactive'} variant={u.isActive ? 'resolved' : 'rejected'} />
                      </td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditRole(u)} title="Change role"
                            className="text-gray-400 hover:text-primary-600">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleActive(u)}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            className={`${u.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-600'}`}>
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Change role: ${editing?.name}`}>
        {msg.text && <Alert type={msg.type} message={msg.text} onClose={() => setMsg({type:'',text:''})} />}
        <div className="space-y-4 mt-3">
          <div>
            <label className="label">New role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRoleChange} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Update Role'}
            </button>
            <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
