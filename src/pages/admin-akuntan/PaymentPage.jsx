import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus } from "lucide-react";
import PurchaseOrderService from "../../services/PurchaseOrderService";
import PaymentService from "../../services/PaymentService";
import { confirmAction } from "../../services/ConfirmationService";
import { localDate, paymentPayload } from "../../utils/procurement";
import { amountError } from "../../utils/payment";

const labels = { draft: "Draft", waiting_confirmation: "Menunggu Konfirmasi", confirmed: "Dikonfirmasi", rejected: "Ditolak" };
const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const newForm = () => ({ purchaseOrderId: "", amount: "", paymentMethod: "bank_transfer", paymentDate: localDate(), notes: "" });
const deletable = (payment) => ["draft", "waiting_confirmation", "rejected"].includes(payment.status);
const blockedOrder = (order) => !order || ["cancelled", "failed"].includes(order.status);
const button = "rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50";
const primary = `${button} bg-blue-600 font-semibold text-white`;
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm";

function PaymentPage({ purchaseOrder = null, onPaymentSummary, readOnly = false }) {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState(newForm);
  const generation = useRef(0);
  const actionLock = useRef(false);
  const invalidateLoad = useCallback(() => { generation.current++; }, []);

  const load = useCallback(async () => {
    const current = ++generation.current;
    setFetching(true);
    setSummaries({});
    try {
      const result = purchaseOrder ? [purchaseOrder] : await PurchaseOrderService.getAll();
      const orderList = Array.isArray(result) ? result : [];
      const entries = await Promise.all(orderList.map(async (order) => ({
        order, ...await PaymentService.getByPurchaseOrderWithSummary(order.purchase_order_id),
      })));
      if (current !== generation.current) return;
      setOrders(orderList);
      setPayments(entries.flatMap(({ order, payments: rows }) => rows.map((payment) => ({ ...payment, purchaseOrder: order }))));
      setSummaries(Object.fromEntries(entries.map(({ order, summary }) => [order.purchase_order_id, summary])));
      entries.forEach(({ order, summary }) => onPaymentSummary?.(order.purchase_order_id, summary));
    } catch (e) {
      if (current === generation.current) setError(e.message || "Gagal memuat ringkasan pembayaran.");
    } finally {
      if (current === generation.current) setFetching(false);
    }
  }, [purchaseOrder, onPaymentSummary]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => { window.clearTimeout(timer); invalidateLoad(); };
  }, [load, invalidateLoad]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return payments.filter((payment) => `${payment.payment_number || ""} ${payment.status || ""} ${payment.purchaseOrder?.po_number || ""}`.toLowerCase().includes(query));
  }, [payments, search]);
  const formOrderId = purchaseOrder?.purchase_order_id || form.purchaseOrderId;
  const formOrder = purchaseOrder || orders.find((order) => order.purchase_order_id === formOrderId);
  const formSummary = summaries[formOrderId];
  const canCreate = !fetching && !blockedOrder(formOrder) && formSummary && Number(formSummary.remaining_amount) > 0;
  const selectedOrderId = selected?.purchase_order_id || selected?.purchaseOrder?.purchase_order_id;

  const detail = async (payment) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await PaymentService.getById(payment.payment_id);
      setSelected({ ...(data?.data || data), purchaseOrder: payment.purchaseOrder });
      await load();
    } catch (e) { setError(e.message); }
    finally { actionLock.current = false; setBusy(false); }
  };

  const action = async (payment, type) => {
    if (readOnly) return;
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    try {
      if (type === "delete" && !await confirmAction({
        title: "Hapus pembayaran?", message: `Pembayaran ${payment.payment_number} akan dihapus permanen.`,
      })) return;
      setError("");
      await PaymentService[type](payment.payment_id);
      setSelected(null);
      await load();
    } catch (e) {
      setError(e?.data?.errors?.amount?.[0] || e?.data?.errors?.payment?.[0] || e?.message);
      await load();
    } finally { actionLock.current = false; setBusy(false); }
  };

  const create = async (event) => {
    event.preventDefault();
    if (readOnly || actionLock.current || !canCreate) return;
    const validation = amountError(form.amount, formSummary);
    setFieldError(validation);
    if (validation) return;
    actionLock.current = true;
    setBusy(true);
    setError("");
    try {
      await PaymentService.create(formOrderId, paymentPayload(form));
      setShow(false);
      setForm(newForm());
      await load();
    } catch (e) {
      setFieldError(e?.data?.errors?.amount?.[0] || "");
      setError(e.message);
      await load();
    } finally { actionLock.current = false; setBusy(false); }
  };

  const feedback = <>{error && <ErrorMessage>{error}</ErrorMessage>}{!fetching && error && <button type="button" disabled={busy} className={button} onClick={() => { setError(""); load(); }}>Muat Ulang Pembayaran</button>}</>;
  if (selected) return <section className="space-y-5">
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{selected.payment_number}</h2><button disabled={busy} onClick={() => setSelected(null)} className={button}>Kembali</button></div>
    {feedback}
    <Summary summary={summaries[selectedOrderId]} loading={fetching} />
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-5 md:grid-cols-3">
        <Info label="No. PO" value={selected.payment_purchase_order?.po_number || selected.purchaseOrder?.po_number || "-"} />
        <Info label="Nominal" value={money(selected.amount)} /><Info label="Status" value={labels[selected.status] || selected.status} />
        <Info label="Metode" value={selected.payment_method} /><Info label="Tanggal" value={selected.payment_date?.slice(0, 10) || "-"} /><Info label="Catatan" value={selected.notes || "-"} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {!readOnly && selected.status === "draft" && <button disabled={busy || fetching} onClick={() => action(selected, "submit")} className={primary}>Kirim Konfirmasi</button>}
        {!readOnly && selected.status === "waiting_confirmation" && <><button disabled={busy || fetching} onClick={() => action(selected, "confirm")} className={primary}>Konfirmasi</button><button disabled={busy} onClick={() => action(selected, "reject")} className={button}>Tolak</button></>}
        {!readOnly && deletable(selected) && <button disabled={busy} onClick={() => action(selected, "delete")} className={`${button} text-red-600`}>Hapus Pembayaran</button>}
      </div>
    </div>
  </section>;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Pembayaran</h2><p className="mt-1 text-sm text-slate-500">{readOnly ? "Lihat status dan riwayat pembayaran purchase order." : "Kelola dan konfirmasi pembayaran purchase order."}</p></div>
      {!readOnly && <button disabled={busy || (purchaseOrder ? !canCreate : fetching || !orders.some((order) => !blockedOrder(order) && Number(summaries[order.purchase_order_id]?.remaining_amount) > 0))} onClick={() => { setError(""); setFieldError(""); setShow(true); }} className={`${primary} inline-flex items-center gap-2`}><Plus size={17} />Buat Pembayaran</button>}
    </div>
    {feedback}
    {purchaseOrder && <Summary summary={summaries[purchaseOrder.purchase_order_id]} loading={fetching} />}
    {purchaseOrder && blockedOrder(purchaseOrder) && <p className="text-sm text-slate-500">Pembayaran tidak dapat dibuat untuk PO dibatalkan atau gagal.</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari pembayaran atau PO..." className={field} /></div>
      <table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50"><tr>{["No", "Pembayaran", "PO", "Nominal", "Status", "Aksi"].map((title) => <th key={title} className="p-4">{title}</th>)}</tr></thead>
        <tbody>{filtered.map((payment, index) => <tr key={payment.payment_id} className="border-t border-slate-100"><td className="p-4">{index + 1}</td><td className="p-4">{payment.payment_number}</td><td className="p-4">{payment.purchaseOrder?.po_number}</td><td className="p-4">{money(payment.amount)}</td><td className="p-4">{labels[payment.status] || payment.status}</td><td className="p-4"><button disabled={busy} onClick={() => detail(payment)} className={`${button} inline-flex items-center gap-1`}><Eye size={14} />Detail</button></td></tr>)}
          {!filtered.length && <tr><td colSpan="6" className="p-10 text-center text-sm text-slate-500">{fetching ? "Memuat pembayaran..." : error ? "Data pembayaran belum tersedia." : "Belum ada pembayaran."}</td></tr>}
        </tbody>
      </table>
    </div>
    {!readOnly && show && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form noValidate onSubmit={create} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
      <h2 className="text-lg font-bold">Buat Pembayaran</h2><p className="mt-2 text-sm text-slate-500">Nomor pembayaran dibuat otomatis. Pembayaran disimpan sebagai draft, lalu dikirim untuk konfirmasi.</p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {error && !fetching && <button type="button" disabled={busy} className={button} onClick={() => { setError(""); load(); }}>Muat Ulang Ringkasan</button>}
      <div className="mt-5 space-y-4">
        {purchaseOrder ? <p>PO: <strong>{purchaseOrder.po_number}</strong></p> : <select aria-label="Purchase Order" required value={form.purchaseOrderId} onChange={(event) => { setForm({ ...form, purchaseOrderId: event.target.value }); setFieldError(""); }} className={field}><option value="">Pilih PO</option>{orders.filter((order) => !blockedOrder(order)).map((order) => <option key={order.purchase_order_id} value={order.purchase_order_id}>{order.po_number}</option>)}</select>}
        <Summary summary={formSummary} loading={fetching} />
        <label className="block text-sm">Nominal<input aria-label="Nominal" aria-describedby={fieldError ? "payment-amount-error" : undefined} aria-invalid={Boolean(fieldError)} required min="0.01" max={formSummary?.remaining_amount} step="0.01" type="number" value={form.amount} onChange={(event) => { setForm({ ...form, amount: event.target.value }); setFieldError(""); }} className={field} /></label>
        {fieldError && <p id="payment-amount-error" role="alert" className="text-sm text-red-600">{fieldError}</p>}
        <div className="grid gap-4 sm:grid-cols-2"><select aria-label="Metode pembayaran" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className={field}><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="ewallet">E-Wallet</option></select><input aria-label="Tanggal pembayaran" type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} className={field} /></div>
        <textarea aria-label="Catatan" placeholder="Catatan" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={field} />
      </div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setShow(false)} className={button}>Batal</button><button disabled={busy || !canCreate} className={primary}>{busy ? "Menyimpan..." : "Simpan Pembayaran"}</button></div>
    </form></div>}
  </section>;
}

function Summary({ summary, loading }) {
  if (loading) return <p className="text-sm text-slate-500">Memuat ringkasan pembayaran...</p>;
  if (!summary) return <p className="text-sm text-slate-500">Ringkasan pembayaran belum tersedia.</p>;
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-4 sm:grid-cols-3"><Info label="Total PO" value={money(summary.total_amount)} /><Info label="Sudah Dibayar" value={money(summary.confirmed_amount)} /><Info label="Sisa Tagihan" value={money(summary.remaining_amount)} /></div><p className="mt-3 font-semibold text-emerald-700">{Number(summary.confirmed_amount) <= 0 ? "Belum Dibayar" : Number(summary.remaining_amount) <= 0 ? "Lunas" : "Dibayar Sebagian"}</p><p className="mt-3 text-xs text-slate-500">Sisa tagihan hanya berkurang dari pembayaran terkonfirmasi.</p></div>;
}
function Info({ label, value }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
function ErrorMessage({ children }) { return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{children}</div>; }
export default PaymentPage;
