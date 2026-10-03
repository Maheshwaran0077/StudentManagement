import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const variants = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircle, iconColor: 'text-green-500' },
  error:   { bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   Icon: XCircle,     iconColor: 'text-red-500' },
  warning: { bg: 'bg-yellow-50 border-yellow-200',text: 'text-yellow-800',Icon: AlertTriangle,iconColor: 'text-yellow-500' },
  info:    { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-800',  Icon: Info,        iconColor: 'text-blue-500' },
};

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  const { bg, text, Icon, iconColor } = variants[type] || variants.info;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${text} text-sm`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
