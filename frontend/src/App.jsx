import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import UserLayout   from './layouts/UserLayout';
import AdminLayout  from './layouts/AdminLayout';
import AuthLayout   from './layouts/AuthLayout';

// Auth pages
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// User pages
import UserDashboard      from './pages/user/UserDashboard';
import SubmitGrievance    from './pages/user/SubmitGrievance';
import MyGrievances       from './pages/user/MyGrievances';
import GrievanceDetail    from './pages/user/GrievanceDetail';
import UserProfile        from './pages/user/UserProfile';

// Admin pages
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminGrievances    from './pages/admin/AdminGrievances';
import AdminPatterns      from './pages/admin/AdminPatterns';
import PatternDetail      from './pages/admin/PatternDetail';
import AdminActions       from './pages/admin/AdminActions';
import ActionDetail       from './pages/admin/ActionDetail';
import AdminOutcomes      from './pages/admin/AdminOutcomes';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminAuditLog      from './pages/admin/AdminAuditLog';
import SemanticSearch     from './pages/admin/SemanticSearch';

// Guards
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const RequireAdmin = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const RedirectIfAuth = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
      </Route>

      {/* User */}
      <Route element={<RequireAuth><UserLayout /></RequireAuth>}>
        <Route path="/dashboard"            element={<UserDashboard />} />
        <Route path="/grievances/submit"    element={<SubmitGrievance />} />
        <Route path="/grievances"           element={<MyGrievances />} />
        <Route path="/grievances/:id"       element={<GrievanceDetail />} />
        <Route path="/profile"              element={<UserProfile />} />
      </Route>

      {/* Admin */}
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route path="/admin/dashboard"      element={<AdminDashboard />} />
        <Route path="/admin/grievances"     element={<AdminGrievances />} />
        <Route path="/admin/patterns"       element={<AdminPatterns />} />
        <Route path="/admin/patterns/:id"   element={<PatternDetail />} />
        <Route path="/admin/actions"        element={<AdminActions />} />
        <Route path="/admin/actions/:id"    element={<ActionDetail />} />
        <Route path="/admin/outcomes"       element={<AdminOutcomes />} />
        <Route path="/admin/users"          element={<AdminUsers />} />
        <Route path="/admin/audit"          element={<AdminAuditLog />} />
        <Route path="/admin/search"         element={<SemanticSearch />} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
