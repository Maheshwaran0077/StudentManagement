import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import { FileText, Clock, CheckCircle, AlertTriangle, PlusCircle } from 'lucide-react';

const STATUS_LABELS = {
  submitted: 'Submitted', under_review: 'Under Review',
  in_progress: 'In Progress', resolved: 'Resolved',
  closed: 'Closed', rejected: 'Rejected',
};

export default function UserDashboard() {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading]       = useState(true);

  const fetchGrievances = async () => {
    try {
      const { data } = await api.get('/grievances?limit=50');
      setGrievances(data.grievances || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGrievances(); }, []);

  // Real-time status updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', user?._id);
    socket.on('grievance_status_update', fetchGrievances);
    return () => socket.off('grievance_status_update', fetchGrievances);
  }, [socket, user]);

  const total      = grievances.length;
  const open       = grievances.filter(g => ['submitted', 'under_review', 'in_progress'].includes(g.status)).length;
  const resolved   = grievances.filter(g => g.status === 'resolved').length;
  const critical   = grievances.filter(g => g.aiAnalysis?.urgencyLevel === 'critical').length;
  const recent     = [...grievances].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's a summary of your grievances"
        actions={
          <Link to="/grievances/submit" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> Submit Grievance
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Submitted"  value={total}    icon={FileText}       color="primary" />
        <StatCard title="Open"             value={open}     icon={Clock}          color="warning" />
        <StatCard title="Resolved"         value={resolved} icon={CheckCircle}    color="success" />
        <StatCard title="Critical Urgency" value={critical} icon={AlertTriangle}  color="danger"  />
      </div>

      {/* Recent grievances */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Grievances</h2>
        {loading ? (
          <Spinner className="py-8" />
        ) : recent.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="mb-3">You haven't submitted any grievances yet.</p>
            <Link to="/grievances/submit" className="btn-primary">Submit your first grievance</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map(g => (
              <Link key={g._id} to={`/grievances/${g._id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{g.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {g.category} · {new Date(g.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge label={STATUS_LABELS[g.status] || g.status} variant={g.status} />
                  {g.aiAnalysis?.urgencyLevel && (
                    <Badge label={g.aiAnalysis.urgencyLevel} variant={g.aiAnalysis.urgencyLevel} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        {grievances.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link to="/grievances" className="text-sm text-primary-600 font-medium hover:underline">
              View all {grievances.length} grievances →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
