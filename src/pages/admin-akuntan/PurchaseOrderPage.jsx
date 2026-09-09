import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import useCachedList from "../../hooks/useCachedList";
import CacheFeedback from "../../components/CacheFeedback";
import { useCallback, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import PurchaseOrderService from "../../services/PurchaseOrderService";
import { PackagingTable } from "../../components/ProcurementDetails";
import PaymentPage from "./PaymentPage";

const labels = { draft: "Draft", sent: "Dikirim", accepted: "Diterima", shipping: "Pengiriman", delivered: "Diterima", completed: "Selesai", failed: "Gagal", cancelled: "Dibatalkan" };
const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

function PurchaseOrderPage() {
  const orderResource = useCachedList("purchase-orders", PurchaseOrderService);
  const orders = orderResource.data;
  const [selectedId, setSelectedId] = useState(null);
  const selectedResource = useCachedList(`purchase-orders:${selectedId}`, PurchaseOrderService, "getById", { args: [selectedId], enabled: selectedId != null, resultType: "object" });
  const selected = selectedResource.data;
  const setSelected = (order) => setSelectedId(order?.purchase_order_id ?? null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const updatePaymentSummary = useCallback((id, summary) => {
    const status = Number(summary.confirmed_amount) <= 0 ? "unpaid" : Number(summary.remaining_amount) <= 0 ? "paid" : "partially_paid";
    setPaymentStatuses((current) => current[id] === status ? current : { ...current, [id]: status });
  }, []);


  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return orders.filter((order) => `${order.po_number || ""} ${order.status || ""} ${order.purchase_order_supplier?.supplier_name || ""}`.toLowerCase().includes(query));
  }, [orders, search]);
  const pagination = usePagination(filtered, search);

  const openDetail = (order) => { setError(""); setSelected(order); };

  const updateStatus = async (order) => {
    if (order.status !== "shipping" || selectedResource.stale) return;
    try {
      await PurchaseOrderService.updateStatus(order.purchase_order_id, "delivered");
      await Promise.all([orderResource.refresh(), selectedResource.refresh()]);
    } catch (e) { setError(e?.data?.message || e.message); }
  };

  if (selected) {
    const details = selected.purchase_order_detail_purchase_order || selected.detail_purchase_orders || [];
    return <section className="space-y-5"><CacheFeedback resources={[orderResource, selectedResource]} />
      <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-blue-600">Purchase Order</p><h1 className="mt-1 text-2xl font-bold">{selected.po_number}</h1></div><button onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Kembali</button></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-5 md:grid-cols-3"><Info label="Supplier" value={selected.purchase_order_supplier?.supplier_name || "-"} /><Info label="Tanggal" value={selected.order_date} /><Info label="Status" value={labels[selected.status] || selected.status} strong /><Info label="Total" value={rupiah(selected.total)} strong /><Info label="Pembayaran" value={paymentStatuses[selected.purchase_order_id] || selected.payment_status || "unpaid"} /><Info label="Tanggal Pengiriman" value={selected.shipping_date?.slice(0, 10) || "-"} /><Info label="Estimasi Tiba" value={selected.expected_delivery_date || "-"} /></div>{selected.status === "shipping" && <button disabled={selectedResource.stale} onClick={() => updateStatus(selected)} className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Tandai Barang Sampai</button>}</div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-sm font-semibold">Detail Barang</h2><div className="overflow-x-auto"><PackagingTable lines={details} /></div></div>
      <PaymentPage key={selected.purchase_order_id} purchaseOrder={selected} orderReady={!selectedResource.stale} onPaymentSummary={updatePaymentSummary} />
    </section>;
  }

  return <section><CacheFeedback resources={[orderResource, selectedResource]} /><div className="mb-5"><p className="text-sm font-medium text-blue-600">Procurement</p><h1 className="mt-1 text-2xl font-bold">Purchase Order</h1><p className="mt-1 text-sm text-slate-500">Pantau lifecycle purchase order yang dibuat dari detail penawaran.</p></div>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari PO, supplier, status..." className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-slate-50"><tr>{["No", "No. PO", "Supplier", "Tanggal", "Total", "Status", "Aksi"].map((title) => <th key={title} className="p-4">{title}</th>)}</tr></thead><tbody>{pagination.items.map((order, index) => <tr key={order.purchase_order_id} className="border-t border-slate-100"><td className="p-4 text-sm">{pagination.offset + index + 1}</td><td className="p-4 text-sm font-semibold">{order.po_number}</td><td className="p-4 text-sm">{order.purchase_order_supplier?.supplier_name || "-"}</td><td className="p-4 text-sm">{order.order_date}</td><td className="p-4 text-right text-sm">{rupiah(order.total)}</td><td className="p-4 text-sm">{labels[order.status] || order.status}</td><td className="p-4 text-center"><button onClick={() => openDetail(order)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"><Eye size={14} />Detail</button></td></tr>)}{!filtered.length && <tr><td colSpan="7" className="p-10 text-center text-sm text-slate-400">Belum ada purchase order.</td></tr>}</tbody></table></div>
        <Pagination pagination={pagination} /></div></section>;
}

function Info({ label, value, strong = false }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-sm ${strong ? "font-semibold" : ""}`}>{value}</p></div>;
}

export default PurchaseOrderPage;
