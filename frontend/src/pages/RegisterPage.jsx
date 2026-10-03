import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const ROLES = ['student', 'faculty', 'staff'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', rollNumber: '', employeeId: '', phone: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
      <p className="text-sm text-gray-500 mb-6">Join Campus Guardian 360</p>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Full name</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="input" placeholder="Jane Doe" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email address</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="input" placeholder="you@university.edu" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              className="input" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input type="password" name="confirmPassword" required value={form.confirmPassword} onChange={handleChange}
              className="input" placeholder="Repeat password" />
          </div>
          <div>
            <label className="label">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className="input">
              {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="input" placeholder="+91 98765 43210" />
          </div>
          {form.role === 'student' && (
            <div className="sm:col-span-2">
              <label className="label">Roll number</label>
              <input name="rollNumber" value={form.rollNumber} onChange={handleChange}
                className="input" placeholder="e.g. CS21B001" />
            </div>
          )}
          {['faculty', 'staff'].includes(form.role) && (
            <div className="sm:col-span-2">
              <label className="label">Employee ID</label>
              <input name="employeeId" value={form.employeeId} onChange={handleChange}
                className="input" placeholder="e.g. EMP-1042" />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? <Spinner size="sm" /> : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
