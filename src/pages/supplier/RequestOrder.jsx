import { useEffect, useState } from "react";
import { Eye, Percent, X } from "lucide-react";
import SupplierQuotationService from "../../services/SupplierQuotationService";
import RequestSupplierService from "../../services/RequestSupplierService";

const labels = { pending: "Menunggu Respons", accepted: "Diterima", rejected: "Ditolak" };
const statusClass = { pending: "bg-amber-50 text-amber-700", accepted: "bg-blue-50 text-blue-700", rejected: "bg-red-50 text-red-700" };

function RequestOrder() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [prices, setPrices] = useState({});
  const [discounts, setDiscounts] = useState({});
  const [packageDiscount, setPackageDiscount] = useState(0);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const data = await SupplierQuotationService.getAll();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || "Gagal memuat request supplier."); }
  };
  useEffect(() => {
    const loadTimer = window.setTimeout(load, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  const detailRows = selected?.request_supplier_purchase_request?.purchase_request_detail_purchase_request || [];
  const itemName = (row) => row?.detail_purchase_request_item?.item_name || row?.item?.item_name || row?.item_id || "-";
  const itemUnit = (row) => {
    const item = row?.detail_purchase_request_item || row?.item;
    return item?.item_unit?.unit_name || item?.itemUnit?.unit_name || "-";
  };

  const open = async (row) => {
    try {
      const data = await SupplierQuotationService.getRequestDetail(row.request_supplier_id);
      setSelected(data);
      setError("");
    } catch (e) { setError(e.message || "Gagal memuat detail request."); }
  };

  const respond = async (status) => {
    if (!selected) return;
    setLoading(true); setError("");
    try {
      await RequestSupplierService.respond(selected.request_supplier_id, { status, ...(status === "rejected" ? { rejection_reason: "Ditolak oleh supplier." } : {}) });
      await load();
      const refreshed = await SupplierQuotationService.getRequestDetail(selected.request_supplier_id);
      setSelected(refreshed);
    } catch (e) { setError(e?.data?.message || e.message || "Gagal menyimpan respons."); }
    finally { setLoading(false); }
  };

  const openQuotation = () => {
    const p = {}; const d = {};
    detailRows.forEach((row) => { p[row.detail_purchase_request_id] = ""; d[row.detail_purchase_request_id] = 0; });
    setPrices(p); setDiscounts(d); setPackageDiscount(0); setQuotationDate(new Date().toISOString().slice(0, 10)); setValidUntil(""); setNotes(""); setQuotation(selected); setError("");
  };

  const normalTotal = detailRows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(prices[row.detail_purchase_request_id] || 0), 0);
  const itemDiscountTotal = detailRows.reduce((sum, row) => { const gross = Number(row.quantity || 0) * Number(prices[row.detail_purchase_request_id] || 0); return sum + gross * (Number(discounts[row.detail_purchase_request_id] || 0) / 100); }, 0);
  const subtotal = normalTotal - itemDiscountTotal;
  const packageDiscountAmount = subtotal * (Number(packageDiscount || 0) / 100);
  const total = subtotal - packageDiscountAmount;

  const submitQuotation = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if (detailRows.some((row) => prices[row.detail_purchase_request_id] === "" || Number(prices[row.detail_purchase_request_id]) < 0)) throw new Error("Harga semua item wajib diisi.");
      await SupplierQuotationService.create(selected.request_supplier_id, {
        quotation_date: quotationDate, valid_until: validUntil || null,
        discount_total_percentage: Number(packageDiscount || 0), notes: notes.trim() || null,
        details: detailRows.map((row) => ({ detail_purchase_request_id: row.detail_purchase_request_id, unit_price: Number(prices[row.detail_purchase_request_id]), discount_percentage: Number(discounts[row.detail_purchase_request_id] || 0) }))
      });
      setQuotation(null); await load();
      const refreshed = await SupplierQuotationService.getRequestDetail(selected.request_supplier_id); setSelected(refreshed);
    } catch (e) { setError(e?.data?.message || e.message || "Gagal membuat quotation."); }
    finally { setLoading(false); }
  };

  return <section className="space-y-5">
    <div><p className="text-sm font-medium text-blue-600">Supplier</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Penawaran</h1><p className="mt-1 text-sm text-slate-500">Penawaran dari Supplier ke Client.</p></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-slate-50"><tr>{["No", "No. Request", "Tanggal Kirim", "Status", "Quotation", "Aksi"].map(x => <th key={x} className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">{x}</th>)}</tr></thead><tbody>{requests.map((row, i) => { const q = row.request_supplier_supplier_quotation; return <tr key={row.request_supplier_id} className="border-t border-slate-100"><td className="px-5 py-4 text-sm">{i + 1}</td><td className="px-5 py-4 text-sm font-semibold">{row.requestSupplierPurchaseRequest?.request_number || row.requestSupplierPurchaseRequest?.nomor || row.purchase_request_id}</td><td className="px-5 py-4 text-sm">{row.sent_at || "-"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[row.status] || "bg-slate-100 text-slate-600"}`}>{labels[row.status] || row.status}</span></td><td className="px-5 py-4 text-sm">{q?.quotation_number || "Belum ada"}</td><td className="px-5 py-4"><button onClick={() => open(row)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"><Eye size={14} /> Detail</button></td></tr> })}{!requests.length && <tr><td colSpan="6" className="px-5 py-10 text-center text-sm text-slate-400">Belum ada request order.</td></tr>}</tbody></table></div></div>

    {selected && !quotation && <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><h2 className="text-lg font-bold">Detail Request</h2><p className="mt-1 text-sm text-slate-500">{selected.requestSupplierPurchaseRequest?.request_number || selected.requestSupplierPurchaseRequest?.nomor || selected.purchase_request_id}</p></div><button onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50">Tutup</button></div><div className="mt-5 overflow-hidden rounded-lg border border-slate-200"><table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-xs text-slate-500">Barang</th><th className="px-4 py-3 text-xs text-slate-500">Qty</th><th className="px-4 py-3 text-xs text-slate-500">Satuan</th><th className="px-4 py-3 text-xs text-slate-500">Catatan</th></tr></thead><tbody>{detailRows.map(r => <tr key={r.detail_purchase_request_id} className="border-t border-slate-100"><td className="px-4 py-3 text-sm font-medium">{itemName(r)}</td><td className="px-4 py-3 text-sm">{r.quantity}</td><td className="px-4 py-3 text-sm">{itemUnit(r)}</td><td className="px-4 py-3 text-sm">{r.notes || "-"}</td></tr>)}</tbody></table></div><div className="mt-5 flex flex-wrap gap-2">{selected.status === "pending" && <><button disabled={loading} onClick={() => respond("accepted")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Terima Request</button><button disabled={loading} onClick={() => respond("rejected")} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">Tolak</button></>}{selected.status === "accepted" && !selected.request_supplier_supplier_quotation && <button onClick={openQuotation} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Buat Quotation</button>}</div></div>}

    {quotation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={submitQuotation} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl"><div className="flex justify-between border-b p-6"><div><h2 className="text-lg font-bold">Buat Supplier Quotation</h2><p className="mt-1 text-sm text-slate-500">Quotation wajib mencakup seluruh item request.</p></div><button type="button" onClick={() => setQuotation(null)}><X size={20} /></button></div><div className="space-y-5 p-6"><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <label>
        <span className="mb-1 block text-xs font-medium">Tanggal</span>
        <input required type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
      </label>
      <label>
        <span className="mb-1 block text-xs font-medium">Berlaku Sampai</span>
        <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
      </label></div><div className="overflow-x-auto"><table className="w-full min-w-[800px]"><thead className="bg-slate-50"><tr><th className="px-3 py-3 text-left text-xs text-slate-500">Barang</th><th className="px-3 py-3 text-center text-xs text-slate-500">Qty</th><th className="px-3 py-3 text-right text-xs text-slate-500">Harga Unit</th><th className="px-3 py-3 text-center text-xs text-slate-500">Diskon</th><th className="px-3 py-3 text-right text-xs text-slate-500">Subtotal</th></tr></thead><tbody>{detailRows.map(r => { const id = r.detail_purchase_request_id; const gross = Number(r.quantity || 0) * Number(prices[id] || 0); const sub = gross - gross * (Number(discounts[id] || 0) / 100); return <tr key={id} className="border-t"><td className="px-3 py-3 text-sm">{itemName(r)}</td><td className="px-3 py-3 text-center text-sm">{r.quantity}</td><td className="px-3 py-3"><input required min="0" type="number" value={prices[id]} onChange={e => setPrices({ ...prices, [id]: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm text-right" /></td><td className="px-3 py-3"><div className="relative"><input min="0" max="100" type="number" value={discounts[id]} onChange={e => setDiscounts({ ...discounts, [id]: e.target.value })} className="w-full rounded-lg border px-3 py-2 pr-8 text-sm text-center" /><Percent size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" /></div></td><td className="px-3 py-3 text-right text-sm font-medium">Rp {sub.toLocaleString("id-ID")}</td></tr> })}</tbody></table></div><div className="ml-auto max-w-md rounded-lg border"><div className="flex justify-between px-4 py-3 text-sm"><span>Harga Normal</span><b>Rp {normalTotal.toLocaleString("id-ID")}</b></div><div className="flex justify-between px-4 py-3 text-sm"><span>Diskon Item</span><b className="text-red-600">- Rp {itemDiscountTotal.toLocaleString("id-ID")}</b></div><div className="flex justify-between border-t px-4 py-3 text-sm"><span>Subtotal</span><b>Rp {subtotal.toLocaleString("id-ID")}</b></div><div className="flex items-center justify-between bg-blue-50/50 px-4 py-3"><span className="text-sm font-medium">Diskon Package</span><div className="relative w-28"><input min="0" max="100" type="number" value={packageDiscount} onChange={e => setPackageDiscount(e.target.value)} className="w-full rounded-lg border px-3 py-2 pr-8 text-sm text-center" /><Percent size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" /></div></div><div className="flex justify-between px-4 py-3 text-sm"><span>Nilai Diskon Package</span><b className="text-red-600">- Rp {packageDiscountAmount.toLocaleString("id-ID")}</b></div><div className="flex justify-between border-t px-4 py-4 text-sm font-bold"><span>Total Penawaran</span><span>Rp {total.toLocaleString("id-ID")}</span></div></div><label><span className="mb-1 block text-xs font-medium">Catatan</span><textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-20 w-full rounded-lg border px-3 py-2.5 text-sm" /></label></div><div className="flex justify-end gap-2 border-t bg-slate-50 p-4"><button type="button" onClick={() => setQuotation(null)} className="rounded-lg border px-4 py-2 text-sm">Batal</button><button disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{loading ? "Mengirim..." : "Kirim Quotation"}</button></div></form></div>}
  </section>;
}
export default RequestOrder;
