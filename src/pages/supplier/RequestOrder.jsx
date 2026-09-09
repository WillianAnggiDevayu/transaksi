import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import { useState } from "react";
import useCachedList from "../../hooks/useCachedList";
import CacheFeedback from "../../components/CacheFeedback";
import { CalendarDays, Check, Eye, FileText, PackagePlus, Pencil, Trash2, X } from "lucide-react";
import SupplierQuotationService from "../../services/SupplierQuotationService";
import RequestSupplierService from "../../services/RequestSupplierService";
import UnitService from "../../services/UnitService";
import QuotationEditor from "../../components/QuotationEditor";
import { ErrorDetails, PackagingTable, QuantitySummary } from "../../components/ProcurementDetails";
import { baseUnit, itemName, unitName, canEditQuotation, newLine, dateOnly, localDate } from "../../utils/procurement";
import { confirmAction } from "../../services/ConfirmationService";
import formatRupiah from "../../utils/formatRupiah";

const STATUS_LABEL = {
  pending: "Menunggu respons", accepted: "Diterima", rejected: "Ditolak",
  draft: "Draft", submitted: "Dikirim", approved: "Disetujui",
  completed: "Selesai", cancelled: "Dibatalkan",
};

const statusClass = status => ({
  rejected: "bg-red-50 text-red-700 ring-red-600/10",
  cancelled: "bg-red-50 text-red-700 ring-red-600/10",
  accepted: "bg-blue-50 text-blue-700 ring-blue-600/10",
  submitted: "bg-blue-50 text-blue-700 ring-blue-600/10",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
}[status] || "bg-amber-50 text-amber-700 ring-amber-600/10");

const formatDate = value => value
  ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value))
  : "-";

export default function RequestOrder() {
  const requestResource = useCachedList("supplier-quotations", SupplierQuotationService);
  const unitResource = useCachedList("units", UnitService);
  const requests = requestResource.data;
  const pagination = usePagination(requests);
  const units = unitResource.data;
  const [selectedId, setSelectedId] = useState(null);
  const detailResource = useCachedList(`supplier-request:${selectedId}`, SupplierQuotationService, "getRequestDetail", { args: [selectedId], enabled: selectedId != null, resultType: "object" });
  const selected = detailResource.data;
  const setSelected = (row) => setSelectedId(row?.request_supplier_id ?? null);
  const [editor, setEditor] = useState(null);
  const [header, setHeader] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const open = (row) => { setError(null); setSelected(row); };
  const refresh = () => Promise.all([requestResource.refresh(), detailResource.refresh()]);
  const pr = selected?.request_supplier_purchase_request;
  const details = pr?.purchase_request_detail_purchase_request || [];
  const quote = selected?.request_supplier_supplier_quotation;
  const lines = quote?.supplier_quotation_detail_supplier_quotation || [];
  const detailPagination = usePagination(details, selectedId);
  const linePagination = usePagination(lines, selectedId);
  const editable = !detailResource.stale && canEditQuotation(quote);
  const act = async callback => {
    setBusy(true); setError(null);
    try { await callback(); await refresh(); } catch (e) { setError(e); } finally { setBusy(false); }
  };
  const saveEditor = async payload => {
    if (editor.kind === "create") await SupplierQuotationService.create(selected.request_supplier_id, payload);
    else if (editor.kind === "add") await SupplierQuotationService.addDetail(quote.supplier_quotation_id, payload);
    else {
      const { detail_purchase_request_id: ignored, ...fields } = payload;
      void ignored;
      await SupplierQuotationService.updateDetail(quote.supplier_quotation_id, editor.line.detail_supplier_quotation_id, fields);
    }
    await refresh();
  };
  const remove = async line => {
    if (!await confirmAction({ title: "Hapus baris kemasan", message: "Hapus baris penawaran ini?" })) return;
    await act(() => SupplierQuotationService.deleteDetail(quote.supplier_quotation_id, line.detail_supplier_quotation_id));
  };
  const closeDetail = () => { setSelected(null); setHeader(null); };
  const saveHeader = async event => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      await SupplierQuotationService.updateHeader(quote.supplier_quotation_id, {
        ...header,
        valid_until: header.valid_until || null,
        discount_total_percentage: Number(header.discount_total_percentage),
      });
      await refresh(); setHeader(null);
    } catch (e) { setError(e); } finally { setBusy(false); }
  };

  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">Penawaran Supplier</h1><CacheFeedback resources={[requestResource, unitResource, detailResource]} />
    {!selected && <ErrorDetails error={error} />}
    <div className="rounded-xl border bg-white">
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50"><tr>{["Request", "Status", "Quotation", "Aksi"].map(t => <th key={t} className="p-4">{t}</th>)}</tr></thead>
        <tbody>{pagination.items.map(row => <tr key={row.request_supplier_id} className="border-t">
          <td className="p-4">{row.request_supplier_purchase_request?.request_number || "-"}</td>
          <td className="p-4">{row.status}</td>
          <td className="p-4">{row.request_supplier_supplier_quotation?.quotation_number || "Belum ada"}</td>
          <td className="p-4"><button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30" onClick={() => open(row)}><Eye size={14} />Detail</button></td>
        </tr>)}</tbody>
      </table>
      {!requests.length && <p className="p-5 text-slate-500">Belum ada permintaan.</p>}
      </div>
      <Pagination pagination={pagination} />
    </div>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button type="button" aria-label="Tutup detail penawaran" className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={closeDetail} />
      <div role="dialog" aria-modal="true" aria-labelledby="quotation-detail-title" className="relative z-10 max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7 sm:py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="quotation-detail-title" className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{quote?.quotation_number || "Detail Request"}</h2>
              <StatusBadge status={quote?.status || selected.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500 sm:text-[13px]">Request {pr?.request_number || "-"} · Informasi penawaran supplier</p>
          </div>
          <button type="button" onClick={closeDetail} className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Tutup"><X size={19} /></button>
        </div>

        <div className="space-y-5 p-4 sm:p-6 lg:p-7">
          <ErrorDetails error={error} />
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem icon={<FileText size={16} />} label="Nomor request" value={pr?.request_number || "-"} />
              <InfoItem icon={<FileText size={16} />} label="Nomor quotation" value={quote?.quotation_number || "Belum dibuat"} />
              <InfoItem icon={<CalendarDays size={16} />} label="Tanggal penawaran" value={formatDate(quote?.quotation_date)} />
              <InfoItem icon={<CalendarDays size={16} />} label="Berlaku sampai" value={formatDate(quote?.valid_until)} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle title="Kebutuhan barang" description="Jumlah barang yang diminta pada purchase request." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{detailPagination.items.map(row => <div key={row.detail_purchase_request_id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-800">{itemName(row)}</p>
              <p className="mt-1 text-xs text-slate-500">Kebutuhan <span className="font-semibold text-slate-700">{row.quantity} {unitName(baseUnit(row))}</span></p>
            </div>)}</div>
            <Pagination pagination={detailPagination} label="Halaman kebutuhan barang" />
          </section>

          {selected.status === "pending" && <ActionNotice title="Respons permintaan" description="Terima request untuk mulai membuat penawaran.">
            <button disabled={busy || detailResource.stale} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50" onClick={() => act(() => RequestSupplierService.respond(selected.request_supplier_id, { status: "accepted" }))}><Check size={15} />Terima Request</button>
            <button disabled={busy || detailResource.stale} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50" onClick={() => act(() => RequestSupplierService.respond(selected.request_supplier_id, { status: "rejected", rejection_reason: "Ditolak oleh supplier." }))}>Tolak Request</button>
          </ActionNotice>}
          {selected.status === "accepted" && !quote && <ActionNotice title="Request telah diterima" description="Lengkapi harga dan rincian kemasan untuk membuat quotation.">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700" onClick={() => setEditor({ kind: "create" })}><PackagePlus size={15} />Buat Quotation</button>
          </ActionNotice>}

          {quote && <>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <SectionTitle title="Rincian penawaran" description="Daftar harga berdasarkan satuan dan kemasan yang ditawarkan." />
              <PackagingTable lines={lines} variant="supplier" />
            </section>
            <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-3 text-sm font-bold text-slate-900 sm:text-[15px]">Kesesuaian kuantitas</h3>
                <QuantitySummary summary={quote.quantity_summary || []} requests={details} variant="supplier" />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-900 sm:text-[15px]">Ringkasan harga</h3></div>
                <div className="space-y-3 px-5 py-4 text-[13px]"><PriceRow label="Subtotal" value={formatRupiah(quote.subtotal)} /><PriceRow label="Diskon total" value={`- ${formatRupiah(quote.discount_amount)}`} accent="text-red-600" /></div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4"><span className="text-sm font-bold text-slate-900">Total penawaran</span><span className="text-base font-bold tabular-nums text-blue-700">{formatRupiah(quote.total)}</span></div>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Catatan penawaran</h3>
              <p className={`mt-2 whitespace-pre-wrap text-[13px] leading-6 ${quote.notes ? "text-slate-600" : "italic text-slate-400"}`}>{quote.notes || "Tidak ada catatan tambahan."}</p>
            </section>

            {editable && <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionTitle title="Kelola penawaran" description="Ubah rincian kemasan atau informasi umum quotation." />
                <button className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => setHeader({ valid_until: dateOnly(quote.valid_until), discount_total_percentage: quote.discount_total_percentage || 0, notes: quote.notes || "" })}><Pencil size={14} />Ubah header</button>
              </div>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">{linePagination.items.map(line => <div key={line.detail_supplier_quotation_id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-[13px] font-semibold text-slate-800">{itemName(line)}</p><p className="mt-0.5 text-xs text-slate-500">{line.quantity} {unitName(line.purchase_unit)} · {formatRupiah(line.subtotal)}</p></div>
                <div className="flex items-center gap-2">
                  <button disabled={busy || detailResource.stale} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40" onClick={() => setEditor({ kind: "edit", line })}><Pencil size={13} />Ubah</button>
                  <button disabled={busy || lines.filter(l => l.detail_purchase_request_id === line.detail_purchase_request_id).length <= 1} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => remove(line)}><Trash2 size={13} />Hapus</button>
                </div>
              </div>)}</div>
              <Pagination pagination={linePagination} label="Halaman kelola penawaran" disabled={busy} />
              <div className="mt-4 flex flex-wrap gap-2">{details.map(row => <button key={row.detail_purchase_request_id} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100" onClick={() => setEditor({ kind: "add", line: newLine(row) })}><PackagePlus size={14} />Tambah kemasan {itemName(row)}</button>)}</div>
            </section>}
            {!editable && <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-[13px] text-slate-600">Penawaran terkunci atau telah melewati masa berlaku.</div>}
            {header && editable && <form className="grid gap-4 rounded-xl border border-blue-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5" onSubmit={saveHeader}>
              <div className="sm:col-span-2"><h3 className="text-sm font-bold text-slate-900">Ubah informasi quotation</h3></div>
              <FormField label="Berlaku sampai"><input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" type="date" min={localDate()} value={header.valid_until} onChange={e => setHeader({ ...header, valid_until: e.target.value })} /></FormField>
              <FormField label="Diskon total (%)"><input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required type="number" min="0" max="100" step="0.01" value={header.discount_total_percentage} onChange={e => setHeader({ ...header, discount_total_percentage: e.target.value })} /></FormField>
              <label className="text-xs font-medium text-slate-700 sm:col-span-2">Catatan<textarea rows="3" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} /></label>
              <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setHeader(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Batal</button><button disabled={busy || detailResource.stale} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Menyimpan..." : "Simpan perubahan"}</button></div>
            </form>}
          </>}
        </div>
      </div>
    </div>}

    {editor && <QuotationEditor key={editor.line?.detail_supplier_quotation_id || editor.line?.clientId || "create"}
      requests={editor.kind === "create" ? details : details.filter(row => row.detail_purchase_request_id === editor.line.detail_purchase_request_id)}
      units={units} initialLine={editor.line} single={editor.kind !== "create"} onSave={saveEditor} onClose={() => setEditor(null)} />}
  </section>;
}

function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass(status)}`}>{STATUS_LABEL[status] || status}</span>;
}

function InfoItem({ icon, label, value }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</span><div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-[13px] font-semibold text-slate-800">{value}</p></div></div>;
}

function SectionTitle({ title, description }) {
  return <div className="mb-4"><h3 className="text-sm font-bold text-slate-900 sm:text-[15px]">{title}</h3><p className="mt-1 text-xs text-slate-500">{description}</p></div>;
}

function ActionNotice({ title, description, children }) {
  return <section className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold text-blue-950">{title}</h3><p className="mt-1 text-xs text-blue-700">{description}</p></div><div className="flex flex-wrap gap-2">{children}</div></section>;
}

function PriceRow({ label, value, accent = "text-slate-800" }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-slate-500">{label}</span><span className={`font-semibold tabular-nums ${accent}`}>{value}</span></div>;
}

function FormField({ label, children }) {
  return <label className="text-xs font-medium text-slate-700">{label}{children}</label>;
}
