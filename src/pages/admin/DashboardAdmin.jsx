import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, ClipboardList, CreditCard, ShoppingCart, Truck, UsersRound } from "lucide-react";
import ItemService from "../../services/ItemService";
import PurchaseOrderService from "../../services/PurchaseOrderService";
import PurchaseRequestService from "../../services/PurchaseRequestService";
import SupplierService from "../../services/SupplierService";
import UserService from "../../services/UserService";

const orderLabels = { draft: "Draft", sent: "Dikirim", accepted: "Diterima", shipping: "Pengiriman", delivered: "Barang Diterima", completed: "Selesai", failed: "Gagal", cancelled: "Dibatalkan" };
const statusColors = { draft: "bg-slate-100 text-slate-600", sent: "bg-blue-50 text-blue-700", accepted: "bg-indigo-50 text-indigo-700", shipping: "bg-amber-50 text-amber-700", delivered: "bg-emerald-50 text-emerald-700", completed: "bg-emerald-50 text-emerald-700", failed: "bg-red-50 text-red-700", cancelled: "bg-red-50 text-red-700" };
const rupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value || 0));

function DashboardAdmin({ onNavigate }) {
  const [data, setData] = useState({ items: [], suppliers: [], users: [], requests: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      ItemService.getAll(),
      SupplierService.getAll(),
      UserService.getAll(),
      PurchaseRequestService.getAll(),
      PurchaseOrderService.getAll(),
    ]).then((results) => {
      if (!active) return;
      const [items, suppliers, users, requests, orders] = results.map((result) =>
        result.status === "fulfilled" && Array.isArray(result.value)
          ? result.value
          : []
      );
      setData({
        items,
        suppliers,
        users,
        requests,
        orders,
      });
      const rejected = results.find((result) => result.status === "rejected");
      if (rejected) setError(rejected.reason?.message || "Sebagian data dashboard gagal dimuat.");
    })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => {
    const activeRequests = data.requests.filter((item) => !["completed", "cancelled"].includes(item.status)).length;
    const activeOrders = data.orders.filter((item) => !["completed", "cancelled", "failed"].includes(item.status)).length;
    const unpaidOrders = data.orders.filter((item) => item.payment_status !== "paid" && !["cancelled", "failed"].includes(item.status)).length;
    const lowStock = data.items.filter((item) => Number(item.stock ?? item.stok ?? 0) <= 5).length;
    const purchaseValue = data.orders.filter((item) => !["cancelled", "failed"].includes(item.status)).reduce((sum, item) => sum + Number(item.total || 0), 0);
    return { activeRequests, activeOrders, unpaidOrders, lowStock, purchaseValue };
  }, [data]);

  const cards = [
    ["Total Barang", data.items.length, "Master barang terdaftar", Boxes, "bg-blue-50 text-blue-600"],
    ["Supplier", data.suppliers.length, "Supplier aktif terdaftar", Truck, "bg-indigo-50 text-indigo-600"],
    ["Purchase Request", summary.activeRequests, "Permintaan masih diproses", ClipboardList, "bg-amber-50 text-amber-600"],
    ["Purchase Order", summary.activeOrders, "PO masih berjalan", ShoppingCart, "bg-cyan-50 text-cyan-600"],
    ["Belum Dibayar", summary.unpaidOrders, "PO menunggu pembayaran", CreditCard, "bg-rose-50 text-rose-600"],
    ["Pengguna", data.users.length, "Akun pengguna sistem", UsersRound, "bg-emerald-50 text-emerald-600"],
  ];

  const recentOrders = [...data.orders].sort((a, b) => new Date(b.created_at || b.order_date) - new Date(a.created_at || a.order_date)).slice(0, 5);
  const processRows = [
    ["Purchase Request aktif", summary.activeRequests, data.requests.length, "bg-amber-500"],
    ["Purchase Order berjalan", summary.activeOrders, data.orders.length, "bg-blue-500"],
    ["Purchase Order selesai", data.orders.filter((item) => item.status === "completed").length, data.orders.length, "bg-emerald-500"],
  ];

  return <section className="space-y-6">
    <div><p className="text-sm font-medium text-blue-600">Dashboard</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Selamat Datang di Dashboard Admin</h1><p className="mt-1 text-sm text-slate-500">Lihat ringkasan data dan aktivitas terbaru sistem.</p></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, description, Icon, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "—" : value}</p><p className="mt-1 text-xs text-slate-400">{description}</p></div><div className={`rounded-xl p-3 ${color}`}><Icon size={21} /></div></div></div>)}</div>

    <div className="grid gap-5 xl:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Status Procurement</h2><p className="mt-1 text-xs text-slate-500">Perkembangan dokumen pembelian saat ini.</p></div><button onClick={() => onNavigate?.("procurementDashboard")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat procurement</button></div><div className="mt-6 space-y-5">{processRows.map(([label, value, total, color]) => { const percentage = total ? Math.round((value / total) * 100) : 0; return <div key={label}><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-600">{label}</span><span className="text-slate-500">{value} dari {total}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div></div>; })}</div></div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-900">Perlu Perhatian</h2><p className="mt-1 text-xs text-slate-500">Ringkasan yang perlu ditindaklanjuti.</p><div className="mt-5 space-y-3"><AlertItem color="amber" label="Stok barang menipis" value={summary.lowStock} /><AlertItem color="rose" label="PO belum dibayar" value={summary.unpaidOrders} /><AlertItem color="blue" label="PR masih aktif" value={summary.activeRequests} /></div><div className="mt-5 rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Total nilai pembelian</p><p className="mt-1 text-base font-bold text-slate-900">{rupiah(summary.purchaseValue)}</p></div></div>
    </div>

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-sm font-semibold text-slate-900">Purchase Order Terbaru</h2><p className="mt-1 text-xs text-slate-500">Lima purchase order yang terakhir dibuat.</p></div><button onClick={() => onNavigate?.("purchaseOrders")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat semua</button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50"><tr><th className="px-5 py-3">Nomor PO</th><th className="px-5 py-3">Supplier</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.purchase_order_id} className="border-t border-slate-100"><td className="px-5 py-4 text-sm font-semibold text-slate-800">{order.po_number}</td><td className="px-5 py-4 text-sm text-slate-600">{order.purchase_order_supplier?.supplier_name || "-"}</td><td className="px-5 py-4 text-sm text-slate-600">{order.order_date || "-"}</td><td className="px-5 py-4 text-right text-sm font-medium">{rupiah(order.total)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>{orderLabels[order.status] || order.status}</span></td></tr>)}{!recentOrders.length && <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-400">Belum ada purchase order.</td></tr>}</tbody></table></div></div>
  </section>;
}

function AlertItem({ color, label, value }) {
  const styles = { amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", blue: "bg-blue-50 text-blue-700" };
  return <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3"><div className="flex items-center gap-2.5"><AlertTriangle size={16} className={styles[color].split(" ")[1]} /><span className="text-xs font-medium text-slate-600">{label}</span></div><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles[color]}`}>{value}</span></div>;
}

export default DashboardAdmin;
