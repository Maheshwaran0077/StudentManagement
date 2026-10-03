const colorMap = {
  // Severity
  low:      'bg-green-100 text-green-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  // Sentiment
  positive: 'bg-green-100 text-green-700',
  negative: 'bg-red-100 text-red-700',
  neutral:  'bg-gray-100 text-gray-600',
  // Status
  submitted:     'bg-blue-100 text-blue-700',
  under_review:  'bg-purple-100 text-purple-700',
  in_progress:   'bg-yellow-100 text-yellow-700',
  resolved:      'bg-green-100 text-green-700',
  closed:        'bg-gray-100 text-gray-600',
  rejected:      'bg-red-100 text-red-700',
  // Trend
  increasing: 'bg-red-100 text-red-700',
  decreasing: 'bg-green-100 text-green-700',
  stable:     'bg-gray-100 text-gray-600',
  emerging:   'bg-orange-100 text-orange-700',
  // Approval
  pending:          'bg-yellow-100 text-yellow-700',
  approved:         'bg-green-100 text-green-700',
  edited_approved:  'bg-teal-100 text-teal-700',
  cancelled:        'bg-gray-100 text-gray-500',
  // Effectiveness
  effective:            'bg-green-100 text-green-700',
  partially_effective:  'bg-yellow-100 text-yellow-700',
  ineffective:          'bg-red-100 text-red-700',
  too_early:            'bg-gray-100 text-gray-600',
};

export default function Badge({ label, variant }) {
  const key = (variant || label || '').toLowerCase().replace(' ', '_');
  const cls = colorMap[key] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${cls}`}>
      {label}
    </span>
  );
}
