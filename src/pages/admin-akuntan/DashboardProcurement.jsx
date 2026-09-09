import useCachedList from "../../hooks/useCachedList";
import CacheFeedback from "../../components/CacheFeedback";
import { CheckCircle2, ClipboardList, CreditCard, ShoppingCart, Truck } from "lucide-react";
import PurchaseRequestService from "../../services/PurchaseRequestService";
import PurchaseOrderService from "../../services/PurchaseOrderService";

function DashboardProcurement() {
  const requests = useCachedList("purchase-requests", PurchaseRequestService);
  const orders = useCachedList("purchase-orders", PurchaseOrderService);
  const data = { requests: requests.data, orders: orders.data };
  const displayCount = (resource, value) => resource.loading ? "—" : resource.error ? "Tidak tersedia" : value;

  const waiting = data.requests.filter(x => ["draft", "waiting_supplier"].includes(x.status)).length;
  const activePO = data.orders.filter(x => !["completed", "cancelled", "failed"].includes(x.status)).length;
  const completed = data.orders.filter(x => x.status === "completed").length;
  const cards = [
    ["Purchase Request", data.requests.length, "Total purchase request", ClipboardList, requests],
    ["Menunggu Supplier", waiting, "PR dalam proses procurement", Truck, requests],
    ["Purchase Order Aktif", activePO, "PO belum selesai", ShoppingCart, orders],
    ["PO Selesai", completed, "PO completed", CheckCircle2, orders],
  ];
  return <section className="space-y-6"><CacheFeedback resources={[requests, orders]} />
    <div><p className="text-sm font-medium text-blue-600">Procurement</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard Akuntan</h1><p className="mt-1 text-sm text-slate-500">Ringkasan proses purchase request sampai purchase order.</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, description, Icon, resource]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{displayCount(resource, value)}</p><p className="mt-1 text-[11px] text-slate-400">{description}</p></div><div className="rounded-lg bg-blue-50 p-3 text-blue-600"><Icon size={20} /></div></div></div>)}</div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><CreditCard size={19} className="text-amber-600" /><div><h2 className="text-sm font-semibold text-slate-900">Monitoring Procurement</h2><p className="mt-1 text-xs text-slate-500">Pantau PR yang masih berada pada proses procurement.</p></div></div></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><ShoppingCart size={19} className="text-blue-600" /><div><h2 className="text-sm font-semibold text-slate-900">Purchase Order</h2><p className="mt-1 text-xs text-slate-500">{displayCount(orders, data.orders.length)} PO tercatat pada sistem.</p></div></div></div></div>
  </section>;
}
export default DashboardProcurement;
