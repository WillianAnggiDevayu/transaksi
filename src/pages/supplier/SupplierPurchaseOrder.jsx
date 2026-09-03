import { useEffect, useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import PurchaseOrderService from "../../services/PurchaseOrderService";

const labels = { draft: "Draft", sent: "Dikirim", accepted: "Diterima", shipping: "Dikirim", delivered: "Barang Diterima", completed: "Selesai", failed: "Gagal", cancelled: "Dibatalkan" };
const badge = { accepted: "bg-blue-50 text-blue-700", delivered: "bg-emerald-50 text-emerald-700", completed: "bg-emerald-50 text-emerald-700", failed: "bg-red-50 text-red-700", cancelled: "bg-red-50 text-red-700" };
const rupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value || 0));

function SupplierPurchaseOrder() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await PurchaseOrderService.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || "Gagal memuat purchase order."); }
  };
  useEffect(() => { load(); }, []);

  const open = async (order) => {
    try {
      const data = await PurchaseOrderService.getById(order.purchase_order_id);
      setSelected(data?.data || data);
      setError("");
    } catch (e) { setError(e.message || "Gagal memuat detail PO."); }
  };

  if (selected) {
    const details = selected.purchase_order_detail_purchase_order || selected.detail_purchase_orders || selected.details || [];
    return <section className="space-y-5">
      <div className="flex items-center gap-3"><button onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"><ArrowLeft size={17} /></button><div><p className="text-sm font-medium text-blue-600">Supplier</p><h1 className="mt-1 text-2xl font-bold">Detail Purchase Order</h1></div></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid grid-cols-1 gap-5 md:grid-cols-3"><Info label="No. PO" value={selected.po_number} strong /><Info label="Purchase Request" value={selected.purchase_order_purchase_request?.request_number || selected.purchase_request_id || "-"} /><Info label="Tanggal Order" value={selected.order_date} /><Info label="Estimasi Tiba" value={selected.expected_delivery_date || "-"} /><div><p className="text-xs text-slate-500">Status</p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge[selected.status] || "bg-slate-100 text-slate-600"}`}>{labels[selected.status] || selected.status}</span></div><Info label="Pembayaran" value={selected.payment_status || "unpaid"} /></div><div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{selected.notes || "Tidak ada catatan."}</div></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-sm font-semibold">Detail Barang</h2><div className="overflow-hidden rounded-lg border border-slate-200"><div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className="bg-slate-50"><tr>{["Barang", "Qty", "Harga", "Diskon", "Subtotal"].map((title, index) => <th key={title} className={`px-4 py-3 text-xs text-slate-500 ${index > 1 ? "text-right" : index === 1 ? "text-center" : "text-left"}`}>{title}</th>)}</tr></thead><tbody>{details.map((detail, index) => <tr key={detail.detail_purchase_order_id || index} className="border-t border-slate-100"><td className="px-4 py-3 text-sm">{detail.detail_purchase_order_item?.item_name || detail.item?.item_name || detail.item_id}</td><td className="px-4 py-3 text-center text-sm">{detail.quantity}</td><td className="px-4 py-3 text-right text-sm">{rupiah(detail.unit_price)}</td><td className="px-4 py-3 text-right text-sm">{detail.discount_percentage || 0}%</td><td className="px-4 py-3 text-right text-sm font-medium">{rupiah(detail.subtotal)}</td></tr>)}</tbody></table></div></div><div className="ml-auto mt-5 max-w-sm space-y-2 border-t border-slate-200 pt-4"><div className="flex justify-between text-sm"><span>Subtotal</span><b>{rupiah(selected.subtotal)}</b></div><div className="flex justify-between text-sm"><span>Diskon</span><b>{rupiah(selected.discount_amount)}</b></div><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold"><span>Total</span><span>{rupiah(selected.total)}</span></div></div></div>
    </section>;
  }

  return <section className="space-y-5"><div><p className="text-sm font-medium text-blue-600">Supplier</p><h1 className="mt-1 text-2xl font-bold">Purchase Order</h1><p className="mt-1 text-sm text-slate-500">Purchase order yang ditujukan kepada supplier.</p></div>{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[850px]"><thead className="bg-slate-50"><tr>{["No", "No. PO", "Tanggal", "Estimasi Tiba", "Total", "Status", "Aksi"].map((title) => <th key={title} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">{title}</th>)}</tr></thead><tbody>{orders.map((order, index) => <tr key={order.purchase_order_id} className="border-t border-slate-100"><td className="px-5 py-4 text-sm">{index + 1}</td><td className="px-5 py-4 text-sm font-semibold">{order.po_number}</td><td className="px-5 py-4 text-sm">{order.order_date}</td><td className="px-5 py-4 text-sm">{order.expected_delivery_date || "-"}</td><td className="px-5 py-4 text-sm">{rupiah(order.total)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[order.status] || "bg-slate-100 text-slate-600"}`}>{labels[order.status] || order.status}</span></td><td className="px-5 py-4"><button onClick={() => open(order)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"><Eye size={14} /> Detail</button></td></tr>)}{!orders.length && <tr><td colSpan="7" className="px-5 py-10 text-center text-sm text-slate-400">Belum ada purchase order.</td></tr>}</tbody></table></div></div></section>;
}

function Info({ label, value, strong = false }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-sm ${strong ? "font-semibold" : ""}`}>{value}</p></div>;
}

export default SupplierPurchaseOrder;
