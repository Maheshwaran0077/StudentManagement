import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Alert from '../../components/Alert';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import { User, Lock, Save } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    rollNumber: user?.rollNumber || '', employeeId: user?.employeeId || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [pwMsg, setPwMsg]           = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading]           = useState(false);

  const handleProfileChange = (e) => setProfileForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePwChange      = (e) => setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await api.put('/auth/profile', profileForm);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally { setProfileLoading(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return setPwMsg({ type: 'error', text: 'Passwords do not match.' });
    if (pwForm.newPassword.length < 6)
      return setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed.' });
    } finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="My Profile" subtitle="Manage your account settings" />

      {/* Profile info card */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge bg-primary-100 text-primary-700 capitalize mt-1">{user?.role}</span>
          </div>
        </div>

        {profileMsg.text && (
          <Alert type={profileMsg.type} message={profileMsg.text} onClose={() => setProfileMsg({ type: '', text: '' })} />
        )}

        <form onSubmit={handleProfileSave} className="space-y-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm text-gray-700">Personal Information</span>
          </div>
          <div>
            <label className="label">Full name</label>
            <input name="name" value={profileForm.name} onChange={handleProfileChange} className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" value={profileForm.phone} onChange={handleProfileChange} className="input" placeholder="+91 98765 43210" />
          </div>
          {user?.role === 'student' && (
            <div>
              <label className="label">Roll number</label>
              <input name="rollNumber" value={profileForm.rollNumber} onChange={handleProfileChange} className="input" />
            </div>
          )}
          {['faculty', 'staff'].includes(user?.role) && (
            <div>
              <label className="label">Employee ID</label>
              <input name="employeeId" value={profileForm.employeeId} onChange={handleProfileChange} className="input" />
            </div>
          )}
          <button type="submit" disabled={profileLoading} className="btn-primary">
            {profileLoading ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Change password card */}
      <div className="card">
        {pwMsg.text && (
          <Alert type={pwMsg.type} message={pwMsg.text} onClose={() => setPwMsg({ type: '', text: '' })} />
        )}
        <form onSubmit={handlePasswordSave} className="space-y-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm text-gray-700">Change Password</span>
          </div>
          <div>
            <label className="label">Current password</label>
            <input type="password" name="currentPassword" value={pwForm.currentPassword} onChange={handlePwChange} className="input" />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" name="newPassword" value={pwForm.newPassword} onChange={handlePwChange} className="input" />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" name="confirmPassword" value={pwForm.confirmPassword} onChange={handlePwChange} className="input" />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? <Spinner size="sm" /> : <><Lock className="w-4 h-4" /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
