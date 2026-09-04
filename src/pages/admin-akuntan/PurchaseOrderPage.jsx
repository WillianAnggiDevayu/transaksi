import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import PurchaseOrderService from "../../services/PurchaseOrderService";

const labels = { draft: "Draft", sent: "Dikirim", accepted: "Diterima", shipping: "Pengiriman", delivered: "Diterima", completed: "Selesai", failed: "Gagal", cancelled: "Dibatalkan" };
const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

function PurchaseOrderPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await PurchaseOrderService.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || "Gagal memuat purchase order."); }
  };
  useEffect(() => {
    const loadTimer = window.setTimeout(load, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return orders.filter((order) => `${order.po_number || ""} ${order.status || ""} ${order.purchase_order_supplier?.supplier_name || ""}`.toLowerCase().includes(query));
  }, [orders, search]);

  const openDetail = async (order) => {
    try {
      const data = await PurchaseOrderService.getById(order.purchase_order_id);
      setSelected(data?.data || data);
      setError("");
    } catch (e) { setError(e.message || "Gagal memuat detail PO."); }
  };

  const updateStatus = async (order) => {
    if (order.status !== "shipping") return;
    try {
      await PurchaseOrderService.updateStatus(order.purchase_order_id, "delivered");
      await load();
      await openDetail(order);
    } catch (e) { setError(e?.data?.message || e.message); }
  };

  if (selected) {
    const details = selected.purchase_order_detail_purchase_order || selected.detail_purchase_orders || [];
    return <section className="space-y-5">
      <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-blue-600">Purchase Order</p><h1 className="mt-1 text-2xl font-bold">{selected.po_number}</h1></div><button onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Kembali</button></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-5 md:grid-cols-3"><Info label="Supplier" value={selected.purchase_order_supplier?.supplier_name || "-"} /><Info label="Tanggal" value={selected.order_date} /><Info label="Status" value={labels[selected.status] || selected.status} strong /><Info label="Total" value={rupiah(selected.total)} strong /><Info label="Pembayaran" value={selected.payment_status || "unpaid"} /><Info label="Estimasi Tiba" value={selected.expected_delivery_date || "-"} /></div>{selected.status === "shipping" && <button onClick={() => updateStatus(selected)} className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Tandai Barang Sampai</button>}</div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-sm font-semibold">Detail Barang</h2><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50"><tr><th className="p-3">Barang</th><th className="p-3">Qty</th><th className="p-3">Harga</th><th className="p-3">Diskon</th><th className="p-3 text-right">Subtotal</th></tr></thead><tbody>{details.map((detail, index) => { const item = detail.detail_purchase_order_item || detail.item; return <tr key={detail.detail_purchase_order_id || index} className="border-t border-slate-100"><td className="p-3 text-sm">{item?.item_name || detail.item_id}</td><td className="p-3 text-sm">{detail.quantity}</td><td className="p-3 text-sm">{rupiah(detail.unit_price)}</td><td className="p-3 text-sm">{detail.discount_percentage || 0}%</td><td className="p-3 text-right text-sm">{rupiah(detail.subtotal)}</td></tr>; })}</tbody></table></div></div>
    </section>;
  }

  return <section><div className="mb-5"><p className="text-sm font-medium text-blue-600">Procurement</p><h1 className="mt-1 text-2xl font-bold">Purchase Order</h1><p className="mt-1 text-sm text-slate-500">Pantau lifecycle purchase order yang dibuat dari detail penawaran.</p></div>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari PO, supplier, status..." className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-slate-50"><tr>{["No", "No. PO", "Supplier", "Tanggal", "Total", "Status", "Aksi"].map((title) => <th key={title} className="p-4">{title}</th>)}</tr></thead><tbody>{filtered.map((order, index) => <tr key={order.purchase_order_id} className="border-t border-slate-100"><td className="p-4 text-sm">{index + 1}</td><td className="p-4 text-sm font-semibold">{order.po_number}</td><td className="p-4 text-sm">{order.purchase_order_supplier?.supplier_name || "-"}</td><td className="p-4 text-sm">{order.order_date}</td><td className="p-4 text-right text-sm">{rupiah(order.total)}</td><td className="p-4 text-sm">{labels[order.status] || order.status}</td><td className="p-4 text-center"><button onClick={() => openDetail(order)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"><Eye size={14} />Detail</button></td></tr>)}{!filtered.length && <tr><td colSpan="7" className="p-10 text-center text-sm text-slate-400">Belum ada purchase order.</td></tr>}</tbody></table></div></div></section>;
}

function Info({ label, value, strong = false }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-sm ${strong ? "font-semibold" : ""}`}>{value}</p></div>;
}

export default PurchaseOrderPage;
