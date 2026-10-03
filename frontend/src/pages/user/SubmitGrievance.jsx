import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Alert from '../../components/Alert';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import { CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'Infrastructure','Academic','Hostel','Canteen','Transport',
  'Administrative','Safety','IT/Network','Library','Sports',
  'Medical','Harassment','Financial','Other',
];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const SENSITIVE_CATS = ['Harassment', 'Safety'];

export default function SubmitGrievance() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: '', subCategory: '',
    location: '', department: '', severity: 'medium', isAnonymous: false,
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.departments || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please select a category.');
    if (form.description.trim().length < 20) return setError('Description must be at least 20 characters.');
    setLoading(true);
    try {
      await api.post('/grievances', form);
      setSuccess(true);
      setTimeout(() => navigate('/grievances'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-green-100 p-5 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Grievance Submitted!</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Your grievance has been recorded and will be analyzed by our AI system. Redirecting…
        </p>
      </div>
    );
  }

  const isSensitive = SENSITIVE_CATS.includes(form.category);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Submit a Grievance" subtitle="Fill in the details below. All fields marked * are required." />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card mt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input name="title" required maxLength={200} value={form.title} onChange={handleChange}
              className="input" placeholder="Brief title of your complaint" />
          </div>

          {/* Category + SubCategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select name="category" required value={form.category} onChange={handleChange} className="input">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sub-category</label>
              <input name="subCategory" value={form.subCategory} onChange={handleChange}
                className="input" placeholder="e.g. Wi-Fi, Hostel Block A" />
            </div>
          </div>

          {/* Location + Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input name="location" value={form.location} onChange={handleChange}
                className="input" placeholder="e.g. Block B, Lab 3" />
            </div>
            <div>
              <label className="label">Department</label>
              <select name="department" value={form.department} onChange={handleChange} className="input">
                <option value="">Select department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="label">Severity *</label>
            <div className="flex gap-3 flex-wrap">
              {SEVERITIES.map(s => (
                <label key={s} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm transition-colors
                  ${form.severity === s ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="severity" value={s} checked={form.severity === s}
                    onChange={handleChange} className="hidden" />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea name="description" required rows={5} maxLength={5000}
              value={form.description} onChange={handleChange}
              className="input resize-none"
              placeholder="Describe your grievance in detail (minimum 20 characters)…" />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/5000 characters</p>
          </div>

          {/* Anonymous submission for sensitive categories */}
          {isSensitive && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <input type="checkbox" name="isAnonymous" id="isAnonymous"
                checked={form.isAnonymous} onChange={handleChange}
                className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="isAnonymous" className="text-sm text-orange-800 cursor-pointer">
                <span className="font-medium">Submit anonymously</span> — your identity will be stored
                separately and only accessible to authorized sensitive officers.
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? <Spinner size="sm" /> : 'Submit Grievance'}
            </button>
            <button type="button" onClick={() => navigate('/grievances')} className="btn-secondary px-6">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
