export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        aria-label="Página anterior"
        className="rounded px-2 py-1 text-[#2875df] disabled:opacity-40"
      >
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onPageChange(idx)}
          aria-current={page === idx ? 'page' : undefined}
          className={`size-8 rounded-md ${
            page === idx ? 'bg-[#2875df] text-white' : 'hover:bg-slate-100'
          }`}
        >
          {idx + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        aria-label="Próxima página"
        className="rounded px-2 py-1 text-[#2875df] disabled:opacity-40"
      >
        ›
      </button>
    </nav>
  )
}
