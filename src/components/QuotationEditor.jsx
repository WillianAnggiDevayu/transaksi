import { useState } from "react";
import { Package } from "lucide-react";
import { baseUnit, itemName, unitName, localDate, newLine, linePayload, validateLine, previewLine, quantitySummary } from "../utils/procurement";
import { ErrorDetails, QuantitySummary } from "./ProcurementDetails";
import formatRupiah from "../utils/formatRupiah";

const input = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";
const label = "text-[13px] font-medium text-slate-700";
export default function QuotationEditor({ requests, units, initialLine, single = false, onSave, onClose }) {
  const [lines, setLines] = useState(() => initialLine ? [{ ...initialLine, clientId: crypto.randomUUID() }] : requests.map(newLine));
  const [header, setHeader] = useState({ quotation_date: localDate(), valid_until: "", discount_total_percentage: 0, notes: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const change = (id, field, value) => setLines(old => old.map(line => {
    if (line.clientId !== id) return line;
    const pr = requests.find(r => r.detail_purchase_request_id === line.detail_purchase_request_id);
    return { ...line, [field]: value, ...(field === "unit_id" && value === (pr.base_unit_id || baseUnit(pr).unit_id) ? { conversion_qty: 1 } : {}) };
  }));
  const subtotal = lines.reduce((sum, line) => sum + previewLine(line).subtotal, 0);
  const total = subtotal - Math.round(subtotal * Number(header.discount_total_percentage || 0)) / 100;
  const submit = async event => {
    event.preventDefault();
    const next = {};
    lines.forEach((line, i) => { const row = validateLine(line, requests.find(pr => pr.detail_purchase_request_id === line.detail_purchase_request_id));
      Object.entries(row).forEach(([key, value]) => { next["details." + i + "." + key] = value; });
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setError(null);
    try {
      await onSave(single ? linePayload(lines[0]) : { ...header, valid_until: header.valid_until || null,
        discount_total_percentage: Number(header.discount_total_percentage || 0), notes: header.notes.trim() || null, details: lines.map(linePayload) });
      onClose();
    } catch (e) {
      setError(e);
      const mapped = {};
      Object.entries(e?.data?.errors || {}).forEach(([key, messages]) => { mapped[single && !key.startsWith("details.") ? "details.0." + key : key] = [messages].flat().join(" "); });
      setErrors(mapped);
    } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
    <form onSubmit={submit} className="max-h-[92vh] w-full max-w-6xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-base font-bold tracking-tight text-slate-900">{single ? "Baris kemasan" : "Buat penawaran"}</h2><ErrorDetails error={error} />
      {!single && <div className="grid gap-4 md:grid-cols-3">
        <label className={label}>Tanggal quotation<input className={input} required type="date" value={header.quotation_date} onChange={e => setHeader({ ...header, quotation_date: e.target.value })} /></label>
        <label className={label}>Berlaku sampai<input className={input} type="date" min={header.quotation_date} value={header.valid_until} onChange={e => setHeader({ ...header, valid_until: e.target.value })} /></label>
        <label className={label}>Diskon total (%)<input className={input} type="number" min="0" max="100" step="0.01" value={header.discount_total_percentage} onChange={e => setHeader({ ...header, discount_total_percentage: e.target.value })} /></label>
      </div>}
      {requests.map(pr => <fieldset key={pr.detail_purchase_request_id} disabled={busy} className="space-y-3 rounded-xl border border-slate-200 p-4">
        <legend className="px-2">
          <span className="inline-flex flex-wrap items-center gap-2.5 rounded-lg bg-white px-1.5 py-1 text-slate-800">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Package size={16} aria-hidden="true" /></span>
            <span className="text-base font-bold">{itemName(pr)}</span>
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-base font-bold text-red-700">Kebutuhan: {pr.quantity} {unitName(baseUnit(pr))}</span>
          </span>
        </legend>
        <p className="text-xs leading-5 text-slate-500">Atur satuan, jumlah kemasan, isi per kemasan, dan harga yang ditawarkan untuk barang ini.</p>
        {lines.map((line, index) => line.detail_purchase_request_id !== pr.detail_purchase_request_id ? null : <div key={line.clientId} className="rounded-lg bg-slate-50 p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className={label}>Satuan Kemasan<select required className={input} value={line.unit_id} onChange={e => change(line.clientId, "unit_id", e.target.value)}>
              <option value="">Pilih satuan</option>{units.map(unit => <option key={unit.unit_id} value={unit.unit_id}>{unitName(unit)}</option>)}
            </select><FieldError errors={errors} index={index} field="unit_id" /></label>
            {["quantity", "conversion_qty", "unit_price", "discount_percentage"].map(field => <label key={field} className={label}>
              {{ quantity: "Jumlah kemasan", conversion_qty: "Isi per " + unitName(units.find(u => u.unit_id === line.unit_id)) + " (" + unitName(baseUnit(pr)) + ")", unit_price: "Harga per satuan Kemasan", discount_percentage: "Diskon (%)" }[field]}
              <input className={input} required type="number" min={["quantity", "conversion_qty"].includes(field) ? 1 : 0}
                max={field === "discount_percentage" ? 100 : ["quantity", "conversion_qty"].includes(field) ? 2147483647 : 9999999999999.99}
                step={["quantity", "conversion_qty"].includes(field) ? 1 : "0.01"} value={line[field]}
                readOnly={field === "conversion_qty" && line.unit_id === (pr.base_unit_id || baseUnit(pr).unit_id)}
                onChange={e => change(line.clientId, field, e.target.value)} />
              <FieldError errors={errors} index={index} field={field} />
            </label>)}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-600">
            <span>Total: {previewLine(line).base_quantity} {unitName(baseUnit(pr))} · Subtotal: {formatRupiah(previewLine(line).subtotal)}</span>
            {!single && <button type="button" className="text-red-600 disabled:opacity-40" disabled={lines.filter(l => l.detail_purchase_request_id === pr.detail_purchase_request_id).length <= 1} onClick={() => setLines(lines.filter(l => l.clientId !== line.clientId))}>Hapus baris</button>}
          </div>
        </div>)}
        {!single && <button type="button" className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] font-semibold text-blue-700" onClick={() => setLines([...lines, newLine(pr)])}>Tambah kemasan</button>}
      </fieldset>)}
      {!single && <><QuantitySummary summary={quantitySummary(requests, lines)} requests={requests} variant="supplier" /><label className={`block ${label}`}>Catatan<textarea className={input} value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} /></label></>}
      <p className="text-sm font-semibold text-slate-800">Pratinjau total: {formatRupiah(total)}</p>
      <div className="flex justify-end gap-3"><button disabled={busy} type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Batal</button>
        <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Menyimpan..." : "Simpan"}</button></div>
    </form>
  </div>;
}
function FieldError({ errors, index, field }) {
  const message = errors["details." + index + "." + field];
  return message ? <span className="block text-xs text-red-600">{message}</span> : null;
}
