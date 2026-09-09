import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import useCachedList from "../../hooks/useCachedList";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, FileText, Plus, Receipt, Search } from "lucide-react";
import PurchaseOrderService from "../../services/PurchaseOrderService";
import PaymentService from "../../services/PaymentService";
import { confirmAction } from "../../services/ConfirmationService";
import { localDate, paymentPayload } from "../../utils/procurement";
import { amountError } from "../../utils/payment";

const labels = { draft: "Draft", waiting_confirmation: "Menunggu Konfirmasi", confirmed: "Dikonfirmasi", rejected: "Ditolak" };
const paymentMethods = { bank_transfer: "Transfer bank", cash: "Tunai", ewallet: "E-wallet" };
const paymentDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};
const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const newForm = () => ({ purchaseOrderId: "", amount: "", paymentMethod: "bank_transfer", paymentDate: localDate(), notes: "" });
const deletable = (payment) => ["draft", "waiting_confirmation", "rejected"].includes(payment.status);
const blockedOrder = (order) => !order || ["cancelled", "failed"].includes(order.status);
const focus = "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";
const button = `rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;
const primary = `rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;
const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const statusColors = { draft: "bg-slate-100 text-slate-600", waiting_confirmation: "bg-amber-50 text-amber-700", confirmed: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700" };

function PaymentContent({ purchaseOrder = null, onPaymentSummary, readOnly = false, orderReady = true }) {
  const orderResource = useCachedList("purchase-orders", PurchaseOrderService, "getAll", { enabled: !purchaseOrder });
  const orders = useMemo(() => purchaseOrder ? [purchaseOrder] : orderResource.data, [purchaseOrder, orderResource.data]);
  const orderIds = useMemo(() => [...new Set(orders.map((order) => order.purchase_order_id))].sort(), [orders]);
  const overview = useCachedList("payment-overview:" + JSON.stringify(orderIds), PaymentService, "getOverview", {
    args: [orderIds], enabled: Boolean(purchaseOrder) || (!orderResource.loading && !orderResource.error),
  });
  const [selectedId, setSelectedId] = useState(null);
  const selectedResource = useCachedList(`payment:${selectedId}`, PaymentService, "getById", { args: [selectedId], enabled: selectedId != null, resultType: "object" });
  const selected = useMemo(() => {
    if (!selectedResource.data) return null;
    const payment = selectedResource.data;
    return { ...payment, purchaseOrder: orders.find((order) => order.purchase_order_id === payment.purchase_order_id) };
  }, [selectedResource.data, orders]);
  const setSelected = (payment) => setSelectedId(payment?.payment_id ?? null);
  const payments = useMemo(() => overview.data.flatMap((entry) => entry.payments.map((payment) => ({
    ...payment, purchase_order_id: payment.purchase_order_id || entry.purchase_order_id,
    purchaseOrder: orders.find((order) => order.purchase_order_id === entry.purchase_order_id),
  }))), [overview.data, orders]);
  const fetching = orderResource.loading || orderResource.refreshing || overview.loading || overview.refreshing;
  const summaries = useMemo(() => !orderReady || fetching || overview.stale || orderResource.stale || overview.error || orderResource.error ? {} : Object.fromEntries(
    overview.data.map((entry) => [entry.purchase_order_id, entry.summary])
  ), [orderReady, fetching, overview.stale, orderResource.stale, overview.error, orderResource.error, overview.data]);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setError] = useState("");
  const error = overview.error?.message || orderResource.error?.message || selectedResource.error?.message || actionError || "";
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(newForm);
  const actionLock = useRef(false);
  const load = overview.refresh;

  useEffect(() => {
    Object.entries(summaries).forEach(([id, summary]) => onPaymentSummary?.(id, summary));
  }, [summaries, onPaymentSummary]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return payments.filter((payment) => `${payment.payment_number || ""} ${payment.status || ""} ${payment.purchaseOrder?.po_number || ""}`.toLowerCase().includes(query));
  }, [payments, search]);
  const pagination = usePagination(filtered, search);
  const formOrderId = purchaseOrder?.purchase_order_id || form.purchaseOrderId;
  const formOrder = purchaseOrder || orders.find((order) => String(order.purchase_order_id) === String(formOrderId));
  const formSummary = summaries[formOrderId];
  const canCreate = !fetching && !blockedOrder(formOrder) && formSummary && Number(formSummary.remaining_amount) > 0;
  const selectedOrderId = selected?.purchase_order_id || selected?.purchaseOrder?.purchase_order_id;

  const detail = (payment) => {
    if (actionLock.current) return;
    setError("");
    setSelected(payment);
    load().catch(() => {});
  };

  const action = async (payment, type) => {
    if (readOnly || !orderReady || selectedResource.stale || overview.stale || fetching) return;
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
      await load().catch(() => {});
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
      await load().catch(() => {});
    } finally { actionLock.current = false; setBusy(false); }
  };

  const retry = async () => { setError(""); if (orderResource.error) await orderResource.refresh(); if (selectedResource.error) await selectedResource.refresh(); await load(); };
  const feedback = <>{error && <ErrorMessage>{error}</ErrorMessage>}{!overview.refreshing && !orderResource.refreshing && error && <button type="button" disabled={busy} className={button} onClick={() => { retry().catch(() => {}); }}>Muat Ulang Pembayaran</button>}</>;
  if (selected) return <section className="min-w-0 space-y-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <p className="text-sm font-medium text-blue-600">Detail Pembayaran</p>
        <h2 className="mt-1 break-words text-2xl font-bold text-slate-900">{selected.payment_number || "Pembayaran"}</h2>
        <p className="mt-1 text-sm text-slate-500">Informasi transaksi dan ringkasan tagihan purchase order.</p>
      </div>
      <button disabled={busy} onClick={() => setSelected(null)} className={`${button} inline-flex shrink-0 items-center justify-center gap-2 self-start`}><ArrowLeft size={15} aria-hidden="true" />Kembali</button>
    </div>
    {feedback}
    <Summary summary={summaries[selectedOrderId]} loading={fetching} detailed />
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-3">
      <div className="min-w-0 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600"><Receipt size={20} aria-hidden="true" /></span>
          <PaymentStatus status={selected.status} />
        </div>
        <p className="text-xs font-medium text-slate-600">Nominal Pembayaran</p>
        <p className="mt-2 break-words text-2xl font-bold tabular-nums tracking-tight text-blue-900 [overflow-wrap:anywhere]">{money(selected.amount)}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">Nominal transaksi ini, bukan total pembayaran PO.</p>
        <div className="mt-5 border-t border-blue-100 pt-4">
          <Info label="No. PO" value={selected.payment_purchase_order?.po_number || selected.purchaseOrder?.po_number || "—"} />
        </div>
      </div>
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <FileText size={17} aria-hidden="true" className="shrink-0 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Informasi Pembayaran</h3>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Info label="Metode Pembayaran" value={paymentMethods[selected.payment_method] || selected.payment_method || "—"} />
            <Info label="Tanggal Pembayaran" value={paymentDate(selected.payment_date)} />
          </div>
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500">Catatan</p>
            <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">{selected.notes || "Tidak ada catatan."}</p>
          </div>
        </div>
        {!readOnly && deletable(selected) && <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button disabled={busy || !orderReady || fetching || overview.stale || selectedResource.stale} onClick={() => action(selected, "delete")} className={`${button} !border-red-200 !text-red-600 hover:!bg-red-50`}>Hapus Pembayaran</button>
          <div className="flex flex-wrap justify-end gap-2">
            {selected.status === "draft" && <button disabled={busy || !orderReady || fetching || overview.stale || selectedResource.stale} onClick={() => action(selected, "submit")} className={primary}>Kirim Konfirmasi</button>}
            {selected.status === "waiting_confirmation" && <><button disabled={busy || !orderReady || fetching || overview.stale || selectedResource.stale} onClick={() => action(selected, "reject")} className={button}>Tolak</button><button disabled={busy || !orderReady || fetching || overview.stale || selectedResource.stale} onClick={() => action(selected, "confirm")} className={primary}>Konfirmasi</button></>}
          </div>
        </div>}
      </div>
    </div>
  </section>;

  return <section className="space-y-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{!purchaseOrder && <p className="text-sm font-medium text-blue-600">Procurement</p>}<h2 className={purchaseOrder ? "text-lg font-bold text-slate-900" : "mt-1 text-2xl font-bold text-slate-900"}>Pembayaran</h2><p className="mt-1 text-sm text-slate-500">{readOnly ? "Lihat status dan riwayat pembayaran purchase order." : "Kelola dan konfirmasi pembayaran purchase order."}</p></div>
      {!readOnly && <button disabled={busy || (purchaseOrder ? !canCreate : fetching || !orders.some((order) => !blockedOrder(order) && Number(summaries[order.purchase_order_id]?.remaining_amount) > 0))} onClick={() => { setError(""); setFieldError(""); setShow(true); }} className={`${primary} inline-flex items-center justify-center gap-2`}><Plus size={17} />Buat Pembayaran</button>}
    </div>
    {feedback}
    {purchaseOrder && <Summary summary={summaries[purchaseOrder.purchase_order_id]} loading={fetching} />}
    {purchaseOrder && blockedOrder(purchaseOrder) && <p className="text-sm text-slate-500">Pembayaran tidak dapat dibuat untuk PO dibatalkan atau gagal.</p>}
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Cari pembayaran atau PO" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari pembayaran atau PO..." className={`${field} pl-9`} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left">
          <thead className="bg-slate-50">
            <tr>{["No", "Pembayaran", "PO", "Nominal", "Status", "Aksi"].map((title) => (
              <th key={title} scope="col" className={`px-5 py-3 text-xs font-semibold uppercase text-slate-500 ${title === "Nominal" ? "text-right" : title === "Aksi" ? "text-center" : ""}`}>{title}</th>
            ))}</tr>
          </thead>
          <tbody>
            {pagination.items.map((payment, index) => (
              <tr key={payment.payment_id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                <td className="px-5 py-4 text-sm text-slate-500">{pagination.offset + index + 1}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-800">{payment.payment_number}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{payment.purchaseOrder?.po_number}</td>
                <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium tabular-nums text-slate-800">{money(payment.amount)}</td>
                <td className="px-5 py-4"><PaymentStatus status={payment.status} /></td>
                <td className="px-5 py-4 text-center">
                  <button disabled={busy} onClick={() => detail(payment)} className={`inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}><Eye size={14} aria-hidden="true" />Detail</button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="6" className="px-5 py-10 text-center text-sm text-slate-500">{fetching ? "Memuat pembayaran..." : error ? "Data pembayaran belum tersedia." : search ? "Tidak ada pembayaran yang sesuai pencarian." : "Belum ada pembayaran."}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} disabled={busy} />
    </div>
    {!readOnly && show && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form noValidate onSubmit={create} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
      <h2 className="text-base font-bold text-slate-900">Buat Pembayaran</h2><p className="mt-2 text-xs leading-5 text-slate-500">Nomor pembayaran dibuat otomatis. Pembayaran disimpan sebagai draft, lalu dikirim untuk konfirmasi.</p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {error && !overview.refreshing && !orderResource.refreshing && <button type="button" disabled={busy} className={button} onClick={() => { retry().catch(() => {}); }}>Muat Ulang Ringkasan</button>}
      <div className="mt-5 space-y-4">
        {purchaseOrder ? <p className="text-sm text-slate-600">PO: <strong className="font-semibold text-slate-800">{purchaseOrder.po_number}</strong></p> : <label className="block space-y-1.5 text-xs font-medium text-slate-600">Purchase Order<select aria-label="Purchase Order" required value={form.purchaseOrderId} onChange={(event) => { setForm({ ...form, purchaseOrderId: event.target.value }); setFieldError(""); }} className={field}><option value="">Pilih PO</option>{orders.filter((order) => !blockedOrder(order)).map((order) => <option key={order.purchase_order_id} value={order.purchase_order_id}>{order.po_number}</option>)}</select></label>}
        <Summary summary={formSummary} loading={fetching} />
        <label className="block space-y-1.5 text-xs font-medium text-slate-600">Nominal<input aria-label="Nominal" aria-describedby={fieldError ? "payment-amount-error" : undefined} aria-invalid={Boolean(fieldError)} required min="0.01" max={formSummary?.remaining_amount} step="0.01" type="number" value={form.amount} onChange={(event) => { setForm({ ...form, amount: event.target.value }); setFieldError(""); }} className={field} /></label>
        {fieldError && <p id="payment-amount-error" role="alert" className="text-sm text-red-600">{fieldError}</p>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5 text-xs font-medium text-slate-600">Metode pembayaran<select aria-label="Metode pembayaran" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className={field}><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="ewallet">E-Wallet</option></select></label><label className="block space-y-1.5 text-xs font-medium text-slate-600">Tanggal pembayaran<input aria-label="Tanggal pembayaran" type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} className={field} /></label></div>
        <label className="block space-y-1.5 text-xs font-medium text-slate-600">Catatan<textarea rows={3} aria-label="Catatan" placeholder="Catatan" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={field} /></label>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={() => setShow(false)} className={button}>Batal</button><button disabled={busy || !canCreate} className={primary}>{busy ? "Menyimpan..." : "Simpan Pembayaran"}</button></div>
    </form></div>}
  </section>;
}

function Summary({ summary, loading, detailed = false }) {
  if (detailed) return <div className="space-y-3" aria-busy={loading}>
    <h3 className="text-sm font-semibold text-slate-900">Ringkasan Tagihan PO</h3>
    <div className="grid min-w-0 gap-3 md:grid-cols-3">
      {[
        { label: "Total PO", key: "total_amount", color: "text-slate-900", description: "Nilai keseluruhan pesanan" },
        { label: "Sudah Dibayar", key: "confirmed_amount", color: "text-emerald-700", description: "Pembayaran terkonfirmasi" },
        { label: "Sisa Tagihan", key: "remaining_amount", color: "text-blue-700", description: "Nominal yang belum dilunasi" },
      ].map(({ label, key, color, description }) => <div key={key} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`mt-2 break-words text-lg font-bold tabular-nums [overflow-wrap:anywhere] ${color}`}>{loading || !summary ? "—" : money(summary[key])}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>)}
    </div>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {!loading && summary && <BalanceStatus summary={summary} />}
      <p role="status" className="text-xs leading-5 text-slate-500">{loading ? "Memuat ringkasan pembayaran..." : !summary ? "Ringkasan pembayaran belum tersedia." : "Sisa tagihan hanya berkurang dari pembayaran terkonfirmasi."}</p>
    </div>
  </div>;
  if (loading) return <p className="text-sm text-slate-500">Memuat ringkasan pembayaran...</p>;
  if (!summary) return <p className="text-sm text-slate-500">Ringkasan pembayaran belum tersedia.</p>;
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-4 sm:grid-cols-3"><Info label="Total PO" value={money(summary.total_amount)} /><Info label="Sudah Dibayar" value={money(summary.confirmed_amount)} /><Info label="Sisa Tagihan" value={money(summary.remaining_amount)} /></div><p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${Number(summary.confirmed_amount) <= 0 ? "bg-slate-100 text-slate-600" : Number(summary.remaining_amount) <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{Number(summary.confirmed_amount) <= 0 ? "Belum Dibayar" : Number(summary.remaining_amount) <= 0 ? "Lunas" : "Dibayar Sebagian"}</p><p className="mt-3 text-xs text-slate-500">Sisa tagihan hanya berkurang dari pembayaran terkonfirmasi.</p></div>;
}
function BalanceStatus({ summary }) {
  const unpaid = Number(summary.confirmed_amount) <= 0;
  const paid = Number(summary.remaining_amount) <= 0;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${unpaid ? "bg-slate-100 text-slate-600" : paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{unpaid ? "Belum Dibayar" : paid ? "Lunas" : "Dibayar Sebagian"}</span>;
}
function Info({ label, value }) { return <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><div className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</div></div>; }
function PaymentStatus({ status }) { return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[status] || statusColors.draft}`}>{labels[status] || status}</span>; }
function ErrorMessage({ children }) { return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{children}</div>; }
function PaymentPage(props) {
  return <PaymentContent key={props.purchaseOrder?.purchase_order_id ?? "all"} {...props} />;
}
export default PaymentPage;
