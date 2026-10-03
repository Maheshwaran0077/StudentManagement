import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <Inbox className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
