import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import { ArrowLeft, CheckCircle, XCircle, Activity, BarChart2 } from 'lucide-react';

export default function ActionDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [action, setAction]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState({ type:'', text:'' });
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal]   = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [approveForm, setApproveForm]   = useState({ adminNotes:'', deadline:'' });
  const [rejectForm, setRejectForm]     = useState({ adminNotes:'' });
  const [progressForm, setProgressForm] = useState({ note:'', status:'' });
  const [saving, setSaving]       = useState(false);
  const [measuring, setMeasuring] = useState(false);

  const fetchAction = () => {
    api.get(`/actions/${id}`)
      .then(({ data }) => setAction(data.action))
      .catch(() => setMsg({ type:'error', text:'Action not found.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAction(); }, [id]);

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.put(`/actions/${id}/approve`, approveForm);
      setMsg({ type:'success', text:'Action approved.' });
      setApproveModal(false);
      fetchAction();
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Approve failed.' });
    } finally { setSaving(false); }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await api.put(`/actions/${id}/reject`, rejectForm);
      setMsg({ type:'success', text:'Action rejected.' });
      setRejectModal(false);
      fetchAction();
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Reject failed.' });
    } finally { setSaving(false); }
  };

  const handleProgress = async () => {
    setSaving(true);
    try {
      await api.put(`/actions/${id}/progress`, progressForm);
      setMsg({ type:'success', text:'Progress updated.' });
      setProgressModal(false);
      fetchAction();
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Update failed.' });
    } finally { setSaving(false); }
  };

  const handleMeasureOutcome = async () => {
    setMeasuring(true);
    try {
      const { data } = await api.post(`/outcomes/measure/${id}`);
      setMsg({ type:'success', text:'Outcome measured. Navigating to outcomes…' });
      setTimeout(() => navigate('/admin/outcomes'), 1500);
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Measurement failed.' });
    } finally { setMeasuring(false); }
  };

  if (loading) return <Spinner className="py-20" />;
  if (!action) return <div className="p-8"><Alert type="error" message={msg.text || 'Not found'} /></div>;

  const isPending   = action.approvalStatus === 'pending';
  const isApproved  = ['approved','edited_approved'].includes(action.approvalStatus);
  const isCompleted = action.status === 'completed';

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={action.title}
        actions={<button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft className="w-4 h-4" />Back</button>}
      />

      {msg.text && <Alert type={msg.type} message={msg.text} onClose={() => setMsg({type:'',text:''})} />}

      {/* Status bar */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-mono text-gray-400">{action.actionId}</span>
          <Badge label={action.approvalStatus} variant={action.approvalStatus} />
          <Badge label={action.status.replace('_',' ')} variant={action.status} />
          {action.recommendation?.priority && (
            <Badge label={`Priority: ${action.recommendation.priority}`} variant={action.recommendation.priority} />
          )}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{action.description}</p>
      </div>

      {/* Recommendation details */}
      {action.recommendation?.suggestedSteps?.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Suggested Steps</h3>
          <ol className="space-y-2">
            {action.recommendation.suggestedSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
            {action.recommendation.targetDepartment && (
              <span>Department: <strong>{action.recommendation.targetDepartment}</strong></span>
            )}
            {action.recommendation.estimatedImpact && (
              <span>Impact: <strong className="capitalize">{action.recommendation.estimatedImpact}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Progress updates */}
      {action.progressUpdates?.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Progress Log</h3>
          <div className="space-y-3">
            {action.progressUpdates.map((u, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <Activity className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-700">{u.note}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(u.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {isPending && (
          <>
            <button onClick={() => setApproveModal(true)} className="btn-success">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => setRejectModal(true)} className="btn-danger">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </>
        )}
        {isApproved && !isCompleted && (
          <button onClick={() => setProgressModal(true)} className="btn-primary">
            <Activity className="w-4 h-4" /> Update Progress
          </button>
        )}
        {isCompleted && (
          <button onClick={handleMeasureOutcome} disabled={measuring} className="btn-secondary">
            <BarChart2 className="w-4 h-4" />
            {measuring ? 'Measuring…' : 'Measure Outcome'}
          </button>
        )}
        {action.patternId && (
          <Link to={`/admin/patterns/${action.patternId._id || action.patternId}`} className="btn-secondary">
            View Pattern
          </Link>
        )}
      </div>

      {/* Approve Modal */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Approve Action">
        <div className="space-y-4">
          <div>
            <label className="label">Deadline (optional)</label>
            <input type="date" value={approveForm.deadline}
              onChange={e => setApproveForm(p=>({...p, deadline:e.target.value}))} className="input" />
          </div>
          <div>
            <label className="label">Admin notes</label>
            <textarea rows={3} value={approveForm.adminNotes}
              onChange={e => setApproveForm(p=>({...p, adminNotes:e.target.value}))}
              className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleApprove} disabled={saving} className="btn-success flex-1">
              {saving ? 'Approving…' : 'Approve'}
            </button>
            <button onClick={() => setApproveModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject Action">
        <div className="space-y-4">
          <div>
            <label className="label">Reason for rejection</label>
            <textarea rows={3} value={rejectForm.adminNotes}
              onChange={e => setRejectForm(p=>({...p, adminNotes:e.target.value}))}
              className="input resize-none" placeholder="Explain why this action is being rejected…" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleReject} disabled={saving} className="btn-danger flex-1">
              {saving ? 'Rejecting…' : 'Reject'}
            </button>
            <button onClick={() => setRejectModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Progress Modal */}
      <Modal open={progressModal} onClose={() => setProgressModal(false)} title="Update Progress">
        <div className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select value={progressForm.status}
              onChange={e => setProgressForm(p=>({...p, status:e.target.value}))} className="input">
              <option value="">Keep current</option>
              {['in_progress','completed','cancelled'].map(s=>(
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Progress note</label>
            <textarea rows={3} value={progressForm.note}
              onChange={e => setProgressForm(p=>({...p, note:e.target.value}))}
              className="input resize-none" placeholder="Describe progress made…" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleProgress} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setProgressModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
