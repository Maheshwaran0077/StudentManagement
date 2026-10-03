import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import {
  Users, FileText, Network, Zap, CheckCircle,
  AlertTriangle, Clock, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#3b82f6','#f59e0b','#22c55e','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [gStats, setGStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/grievances/stats'),
    ]).then(([{ data: s }, { data: g }]) => {
      setStats(s);
      setGStats(g);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="py-20" />;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="System-wide overview" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users"       value={stats?.totalUsers}       icon={Users}         color="primary" />
        <StatCard title="Total Grievances"  value={stats?.totalGrievances}  icon={FileText}      color="primary" />
        <StatCard title="Open Grievances"   value={stats?.openGrievances}   icon={Clock}         color="warning" />
        <StatCard title="Resolved"          value={stats?.resolvedGrievances} icon={CheckCircle} color="success" />
        <StatCard title="Active Patterns"   value={stats?.totalPatterns}    icon={Network}       color="purple" />
        <StatCard title="Pending Approvals" value={stats?.pendingActions}   icon={Zap}           color="warning" />
        <StatCard title="Completed Actions" value={stats?.completedActions} icon={CheckCircle}   color="success" />
        <StatCard title="Recurrences"       value={stats?.recurrenceCount}  icon={RefreshCw}     color="danger"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category bar chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Grievances by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gStats?.byCategory || []} margin={{ top: 5, right: 10, left: -10, bottom: 50 }}>
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Grievances by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={gStats?.byStatus || []} dataKey="count" nameKey="_id"
                cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) =>
                  `${_id} ${(percent * 100).toFixed(0)}%`}>
                {(gStats?.byStatus || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly trend */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Grievance Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={gStats?.weeklyTrend || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/patterns" className="card hover:shadow-md transition-shadow text-center group">
          <Network className="w-8 h-8 text-primary-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-800">Discover Patterns</p>
          <p className="text-xs text-gray-400 mt-1">Run AI pattern discovery</p>
        </Link>
        <Link to="/admin/actions" className="card hover:shadow-md transition-shadow text-center group">
          <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-800">Pending Approvals</p>
          <p className="text-xs text-gray-400 mt-1">{stats?.pendingActions} actions awaiting review</p>
        </Link>
        <Link to="/admin/search" className="card hover:shadow-md transition-shadow text-center group">
          <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-800">Semantic Search</p>
          <p className="text-xs text-gray-400 mt-1">Search patterns by meaning</p>
        </Link>
      </div>
    </div>
  );
}
