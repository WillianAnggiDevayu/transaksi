import { ChevronLeft, ChevronRight } from "lucide-react";

const button = "inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export default function Pagination({ pagination, label = "Navigasi halaman data", disabled = false }) {
  const { page, pageCount, total, offset, pageSize, setPage } = pagination;
  if (total <= pageSize) return null;

  return <nav aria-label={label} className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
    <p aria-live="polite" aria-atomic="true" className="text-xs text-slate-500">
      Menampilkan <span className="font-semibold text-slate-700">{offset + 1}–{Math.min(offset + pageSize, total)}</span> dari {total} data
    </p>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setPage(page - 1)} disabled={disabled || page === 1} className={button}><ChevronLeft size={14} aria-hidden="true" />Sebelumnya</button>
      <span className="text-xs tabular-nums text-slate-600">Halaman {page} dari {pageCount}</span>
      <button type="button" onClick={() => setPage(page + 1)} disabled={disabled || page === pageCount} className={button}>Selanjutnya<ChevronRight size={14} aria-hidden="true" /></button>
    </div>
  </nav>;
}
