import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' || user.role === 'sensitive_officer'
        ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <input
            type="email" name="email" required
            value={form.email} onChange={handleChange}
            className="input" placeholder="you@university.edu"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password" name="password" required
            value={form.password} onChange={handleChange}
            className="input" placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? <Spinner size="sm" /> : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
      </p>
    </div>
  );
}
