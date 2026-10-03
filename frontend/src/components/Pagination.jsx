import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-secondary px-3 py-1.5 disabled:opacity-40">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="btn-secondary px-3 py-1.5 disabled:opacity-40">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
