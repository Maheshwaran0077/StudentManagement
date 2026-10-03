export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger:  'bg-red-50 text-red-600',
    purple:  'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
