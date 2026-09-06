import { useEffect, useState } from "react";
import SupplierQuotationService from "../../services/SupplierQuotationService";
import RequestSupplierService from "../../services/RequestSupplierService";
import UnitService from "../../services/UnitService";
import QuotationEditor from "../../components/QuotationEditor";
import { ErrorDetails, PackagingTable, QuantitySummary } from "../../components/ProcurementDetails";
import { baseUnit, itemName, unitName, canEditQuotation, newLine, dateOnly, localDate } from "../../utils/procurement";
import { confirmAction } from "../../services/ConfirmationService";
import formatRupiah from "../../utils/formatRupiah";

export default function RequestOrder() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [units, setUnits] = useState([]);
  const [editor, setEditor] = useState(null);
  const [header, setHeader] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => setRequests(await SupplierQuotationService.getAll());
  useEffect(() => {
    let active = true;
    Promise.all([SupplierQuotationService.getAll(), UnitService.getAll()]).then(([rows, unitRows]) => {
      if (active) { setRequests(rows); setUnits(unitRows); }
    }).catch(e => { if (active) setError(e); });
    return () => { active = false; };
  }, []);
  const open = async row => {
    setError(null);
    try { setSelected(await SupplierQuotationService.getRequestDetail(row.request_supplier_id)); }
    catch (e) { setError(e); }
  };
  const refresh = async () => { await load(); setSelected(await SupplierQuotationService.getRequestDetail(selected.request_supplier_id)); };
  const pr = selected?.request_supplier_purchase_request;
  const details = pr?.purchase_request_detail_purchase_request || [];
  const quote = selected?.request_supplier_supplier_quotation;
  const lines = quote?.supplier_quotation_detail_supplier_quotation || [];
  const editable = canEditQuotation(quote);
  const act = async callback => {
    setBusy(true); setError(null);
    try { await callback(); await refresh(); } catch (e) { setError(e); } finally { setBusy(false); }
  };
  const saveEditor = async payload => {
    // Persist one existing row at a time: a failed request leaves the form intact.
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
  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">Penawaran Supplier</h1><ErrorDetails error={error} />
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Request", "Status", "Quotation", "Aksi"].map(t => <th key={t} className="p-4">{t}</th>)}</tr></thead>
      <tbody>{requests.map(row => <tr key={row.request_supplier_id} className="border-t"><td className="p-4">{row.request_supplier_purchase_request?.request_number || "-"}</td><td className="p-4">{row.status}</td><td className="p-4">{row.request_supplier_supplier_quotation?.quotation_number || "Belum ada"}</td><td className="p-4"><button className="text-blue-600" onClick={() => open(row)}>Detail</button></td></tr>)}</tbody></table>
      {!requests.length && <p className="p-5 text-slate-500">Belum ada permintaan.</p>}
    </div>
    {selected && <div className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex justify-between"><h2 className="text-lg font-bold">{pr?.request_number}</h2><button onClick={() => { setSelected(null); setHeader(null); }}>Tutup</button></div>
      {details.map(row => <p key={row.detail_purchase_request_id}>{itemName(row)}: kebutuhan <b>{row.quantity} {unitName(baseUnit(row))}</b></p>)}
      {selected.status === "pending" && <div className="flex gap-3"><button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => act(() => RequestSupplierService.respond(selected.request_supplier_id, { status: "accepted" }))}>Terima Request</button>
        <button disabled={busy} className="rounded-lg border px-4 py-2" onClick={() => act(() => RequestSupplierService.respond(selected.request_supplier_id, { status: "rejected", rejection_reason: "Ditolak oleh supplier." }))}>Tolak Request</button></div>}
      {selected.status === "accepted" && !quote && <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => setEditor({ kind: "create" })}>Buat Quotation</button>}
      {quote && <>
        <h3 className="font-bold">{quote.quotation_number} · {quote.status}</h3>
        <PackagingTable lines={lines} /><QuantitySummary summary={quote.quantity_summary || []} requests={details} />
        <p>Subtotal: {formatRupiah(quote.subtotal)} · Diskon total: {formatRupiah(quote.discount_amount)} · <b>Total: {formatRupiah(quote.total)}</b></p>
        {editable && <div className="space-y-3">
          {lines.map(line => <div key={line.detail_supplier_quotation_id} className="flex flex-wrap items-center gap-3 text-sm">
            <span>{itemName(line)} — {line.quantity} {unitName(line.purchase_unit)}</span>
            <button disabled={busy} className="text-blue-600" onClick={() => setEditor({ kind: "edit", line })}>Ubah baris</button>
            <button disabled={busy || lines.filter(l => l.detail_purchase_request_id === line.detail_purchase_request_id).length <= 1} className="text-red-600 disabled:opacity-40" onClick={() => remove(line)}>Hapus</button>
          </div>)}
          {details.map(row => <button key={row.detail_purchase_request_id} className="mr-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-700" onClick={() => setEditor({ kind: "add", line: newLine(row) })}>Tambah kemasan {itemName(row)}</button>)}
          <button className="rounded-lg border px-3 py-2" onClick={() => setHeader({ valid_until: dateOnly(quote.valid_until), discount_total_percentage: quote.discount_total_percentage || 0, notes: quote.notes || "" })}>Ubah header</button>
        </div>}
        {!editable && <p className="text-sm text-slate-500">Penawaran terkunci atau telah melewati masa berlaku.</p>}
        {header && editable && <form className="grid gap-3 rounded-lg border p-4" onSubmit={async event => {
          event.preventDefault(); setBusy(true); setError(null);
          try { await SupplierQuotationService.updateHeader(quote.supplier_quotation_id, { ...header, valid_until: header.valid_until || null, discount_total_percentage: Number(header.discount_total_percentage) }); await refresh(); setHeader(null); }
          catch (e) { setError(e); } finally { setBusy(false); }
        }}>
          <label>Berlaku sampai<input className="ml-3 rounded border p-2" type="date" min={localDate()} value={header.valid_until} onChange={e => setHeader({ ...header, valid_until: e.target.value })} /></label>
          <label>Diskon total (%)<input className="ml-3 rounded border p-2" required type="number" min="0" max="100" step="0.01" value={header.discount_total_percentage} onChange={e => setHeader({ ...header, discount_total_percentage: e.target.value })} /></label>
          <label>Catatan<textarea className="block w-full rounded border p-2" value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} /></label>
          <button disabled={busy} className="rounded bg-blue-600 p-2 text-white">Simpan header</button>
        </form>}
      </>}
    </div>}
    {editor && <QuotationEditor key={editor.line?.detail_supplier_quotation_id || editor.line?.clientId || "create"}
      requests={editor.kind === "create" ? details : details.filter(pr => pr.detail_purchase_request_id === editor.line.detail_purchase_request_id)}
      units={units} initialLine={editor.line} single={editor.kind !== "create"} onSave={saveEditor} onClose={() => setEditor(null)} />}
  </section>;
}
