import useCachedList from "../../hooks/useCachedList";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Boxes, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, CreditCard, PackageCheck, ShoppingCart, Truck, UsersRound } from "lucide-react";
import ItemService from "../../services/ItemService";
import PurchaseOrderService from "../../services/PurchaseOrderService";
import PurchaseRequestService from "../../services/PurchaseRequestService";
import SupplierService from "../../services/SupplierService";
import UserService from "../../services/UserService";

const sources = [
  ["items", "Barang", ItemService], ["suppliers", "Supplier", SupplierService],
  ["users", "Pengguna", UserService], ["requests", "Purchase request", PurchaseRequestService],
  ["orders", "Purchase order", PurchaseOrderService],
];
const orderLabels = { draft: "Draft", sent: "Dikirim", accepted: "Diterima", shipping: "Dalam pengiriman", delivered: "Barang diterima", completed: "Selesai", failed: "Gagal", cancelled: "Dibatalkan" };
const statusColors = {
  draft: "bg-slate-100 text-slate-600", sent: "bg-blue-50 text-blue-700", accepted: "bg-violet-50 text-violet-700",
  shipping: "bg-amber-50 text-amber-700", delivered: "bg-cyan-50 text-cyan-700", completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700", cancelled: "bg-rose-50 text-rose-700",
};
const panel = "min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm";
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";
const rupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const timestamp = (value) => Date.parse(value) || 0;
const formatDate = (value) => !value || Number.isNaN(Date.parse(value)) ? "—"
  : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

function DashboardAdmin({ onNavigate, user }) {
  const items = useCachedList("items", ItemService);
  const suppliers = useCachedList("suppliers", SupplierService);
  const users = useCachedList("users", UserService);
  const requests = useCachedList("purchase-requests", PurchaseRequestService);
  const orders = useCachedList("purchase-orders", PurchaseOrderService);
  const resources = { items, suppliers, users, requests, orders };
  const data = { items: items.data, suppliers: suppliers.data, users: users.data, requests: requests.data, orders: orders.data };
  const loading = Object.values(resources).some((resource) => resource.loading);
  const failed = Object.keys(resources).filter((key) => resources[key].error);
  const [today] = useState(() => new Date());

  const summary = (() => {
    const validOrders = data.orders.filter((order) => !["cancelled", "failed"].includes(order.status));
    const completedOrders = data.orders.filter((order) => order.status === "completed").length;
    return {
      activeRequests: data.requests.filter((request) => !["completed", "cancelled"].includes(request.status)).length,
      activeOrders: validOrders.filter((order) => order.status !== "completed").length,
      unpaidOrders: validOrders.filter((order) => order.payment_status !== "paid").length,
      lowStock: data.items.filter((item) => Number(item.stock ?? item.stok ?? 0) <= 5).length,
      purchaseValue: validOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
      completedOrders,
      completionRate: data.orders.length ? Math.round(completedOrders / data.orders.length * 100) : 0,
    };
  })();
  const recentOrders = [...data.orders]
    .sort((a, b) => timestamp(b.created_at || b.order_date) - timestamp(a.created_at || a.order_date))
    .slice(0, 5);
  const available = (source) => !loading && !failed.includes(source);
  const display = (source, value) => loading ? "—" : failed.includes(source) ? "Tidak tersedia" : value;
  const cards = [
    { label: "Total nilai pembelian", value: rupiah(summary.purchaseValue), detail: "Tidak termasuk PO gagal / dibatalkan", source: "orders", icon: CircleDollarSign, color: "bg-blue-50 text-blue-600", bar: "bg-blue-600", money: true },
    { label: "Purchase request aktif", value: summary.activeRequests, detail: "Permintaan yang masih diproses", source: "requests", icon: ClipboardList, color: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
    { label: "Purchase order berjalan", value: summary.activeOrders, detail: "Pesanan yang belum selesai", source: "orders", icon: ShoppingCart, color: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
    { label: "Tingkat penyelesaian PO", value: `${summary.completionRate}%`, detail: "PO selesai dari seluruh purchase order", source: "orders", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  ];
  const processRows = [
    { label: "PR aktif", value: summary.activeRequests, total: data.requests.length, source: "requests", color: "text-amber-500" },
    { label: "PO berjalan", value: summary.activeOrders, total: data.orders.length, source: "orders", color: "text-blue-500" },
    { label: "PO selesai", value: summary.completedOrders, total: data.orders.length, source: "orders", color: "text-emerald-500" },
  ];
  const attention = [
    { label: "Stok barang menipis", detail: "Stok tersisa 5 atau kurang", value: summary.lowStock, source: "items", target: "items", icon: Boxes, color: "bg-amber-50 text-amber-700" },
    { label: "PO belum lunas", detail: "Pantau proses pembayaran", value: summary.unpaidOrders, source: "orders", target: "payments", icon: CreditCard, color: "bg-rose-50 text-rose-700" },
    { label: "PR masih aktif", detail: "Lanjutkan proses permintaan", value: summary.activeRequests, source: "requests", target: "purchaseRequests", icon: ClipboardList, color: "bg-blue-50 text-blue-700" },
  ];
  const masterData = [
    { label: "Barang", source: "items", icon: Boxes, color: "bg-blue-50 text-blue-600" },
    { label: "Supplier terdaftar", source: "suppliers", icon: Truck, color: "bg-violet-50 text-violet-600" },
    { label: "Pengguna", source: "users", icon: UsersRound, color: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <section aria-label="Dashboard admin" aria-busy={loading} className="min-w-0 space-y-6 pb-4">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2a68] via-[#17499e] to-[#2871df] p-6 text-white shadow-lg shadow-blue-950/10 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-32 -z-10 h-80 w-80 rounded-full border-[40px] border-white/5" />
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Dashboard admin</p>
            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">Selamat datang, {user?.name?.trim() || "Admin"}!</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Pantau inventori dan proses pembelian dalam satu tampilan.</p>
          </div>
          <div className="shrink-0 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays size={16} aria-hidden="true" />
              <span>{today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <p className="mt-1.5 text-xs text-blue-100">Cakupan ringkasan: seluruh data</p>
          </div>
        </div>
      </div>

      {failed.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle size={19} aria-hidden="true" className="shrink-0" />
          <div><p className="text-sm font-semibold">Sebagian data belum tersedia</p>
            <p className="mt-1 text-xs leading-5">Gagal memuat: {sources.filter(([key]) => failed.includes(key)).map(([, label]) => label).join(", ")}. Indikator terkait tidak ditampilkan.</p>
          </div>
        </div>
      )}
      {loading && <p role="status" className="sr-only">Memuat data dashboard...</p>}

      <div>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-sm font-bold text-slate-900">Data master</h2><p className="text-xs text-slate-500">Kelola data pendukung operasional.</p></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {masterData.map(({ label, source, icon: Icon, color }) => (
            <button key={source} type="button" onClick={() => onNavigate?.(source)} className={`${panel} ${focus} group flex items-center gap-3 p-4 text-left transition hover:border-blue-200 hover:shadow-md`}>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={21} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs text-slate-500">{label}</span><span className="mt-1 block break-words text-lg font-bold text-slate-900">{display(source, data[source].length)}</span></span>
              <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-blue-600" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, source, icon: Icon, color, bar, money }) => (
          <article key={label} aria-label={label} className={`${panel} relative overflow-hidden p-5`}>
            <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${bar}`} />
            <div className="flex items-center justify-between gap-2">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={21} aria-hidden="true" /></span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Ringkasan</span>
            </div>
            <h2 className="mt-4 text-xs font-medium text-slate-500">{label}</h2>
            <p className={`mt-2 font-bold tracking-tight text-slate-900 [overflow-wrap:anywhere] ${failed.includes(source) ? "text-lg" : money ? "text-2xl" : "text-3xl"}`}>{display(source, value)}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
          </article>
        ))}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-5">
        <div className={`${panel} p-5 sm:p-6 xl:col-span-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-bold text-slate-900">Progres procurement</h2><p className="mt-1 text-xs leading-5 text-slate-500">Posisi dokumen pembelian yang tercatat.</p></div>
            <NavLink onClick={() => onNavigate?.("procurementDashboard")}>Buka procurement</NavLink>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {processRows.map(({ label, value, total, source, color }) => {
              const percentage = total ? Math.round(value / total * 100) : 0;
              const ready = available(source);
              return (
                <div key={label} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-5 text-center">
                  <div
                    role={ready ? "progressbar" : undefined}
                    aria-label={ready ? label : undefined}
                    aria-valuemin={ready ? 0 : undefined}
                    aria-valuemax={ready ? 100 : undefined}
                    aria-valuenow={ready ? percentage : undefined}
                    aria-valuetext={ready ? `${value} dari ${total} dokumen` : undefined}
                    className="relative mx-auto h-28 w-28"
                  >
                    <svg viewBox="0 0 120 120" aria-hidden="true" className="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="9" className="text-slate-200/70" />
                      {ready && percentage > 0 && (
                        <circle
                          cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="9"
                          pathLength="100" strokeDasharray="100" strokeDashoffset={100 - percentage}
                          strokeLinecap="round" className={color}
                        />
                      )}
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                      {ready ? `${percentage}%` : "—"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-700">{label}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{loading ? "Memuat..." : display(source, `${value} dari ${total} dokumen`)}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">PR dibandingkan dengan total permintaan; PO dibandingkan dengan total pesanan.</p>
        </div>
        <div className={`${panel} p-5 sm:p-6 xl:col-span-2`}>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="font-bold text-slate-900">Perlu perhatian</h2><p className="mt-1 text-xs leading-5 text-slate-500">Akses cepat untuk tindak lanjut.</p></div>
            <AlertTriangle size={19} aria-hidden="true" className="shrink-0 text-amber-500" />
          </div>
          <div className="mt-5 space-y-3">
            {attention.map(({ label, detail, value, source, target, icon: Icon, color }) => (
              <button key={label} type="button" onClick={() => onNavigate?.(target)} className={`${focus} group flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon size={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-700">{label}</span><span className="mt-1 block text-xs leading-4 text-slate-500">{detail}</span></span>
                <span className="max-w-20 text-right text-sm font-bold text-slate-800">{display(source, value)}</span>
                <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
          <div><h2 className="font-bold text-slate-900">Purchase order terbaru</h2><p className="mt-1 text-xs text-slate-500">Lima pesanan yang terakhir dibuat.</p></div>
          <NavLink onClick={() => onNavigate?.("purchaseOrders")}>Lihat semua PO</NavLink>
        </div>
        {loading || failed.includes("orders") || !recentOrders.length ? (
          <div className="px-5 py-12 text-center">
            <PackageCheck size={30} aria-hidden="true" className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">{loading ? "Memuat purchase order..." : failed.includes("orders") ? "Data purchase order tidak tersedia" : "Belum ada purchase order"}</p>
            <p className="mt-1 text-xs text-slate-500">{loading ? "Menyiapkan aktivitas terbaru." : failed.includes("orders") ? "Ringkasan lainnya tetap dapat dilihat." : "Pesanan yang dibuat akan muncul di sini."}</p>
          </div>
        ) : (
          <div role="region" aria-label="Tabel purchase order, gulir horizontal untuk melihat semua kolom" tabIndex={0} className={`${focus} overflow-x-auto focus-visible:ring-inset`}>
            <table className="w-full min-w-[760px] text-left">
              <caption className="sr-only">Lima purchase order terbaru</caption>
              <thead className="bg-slate-50/80"><tr>
                <th scope="col" className="px-6 py-3">Nomor PO</th><th scope="col" className="px-5 py-3">Supplier</th><th scope="col" className="px-5 py-3">Tanggal</th><th scope="col" className="px-5 py-3 text-right">Total</th><th scope="col" className="px-5 py-3">Status</th>
              </tr></thead>
              <tbody>{recentOrders.map((order, index) => (
                <tr key={order.purchase_order_id || order.po_number || index} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="max-w-56 break-words px-6 py-4 text-sm font-semibold text-slate-800">{order.po_number || "—"}</td>
                  <td className="max-w-64 break-words px-5 py-4 text-sm text-slate-600">{order.purchase_order_supplier?.supplier_name || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(order.order_date || order.created_at)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold tabular-nums text-slate-800">{rupiah(Number(order.total || 0))}</td>
                  <td className="px-5 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status] || statusColors.draft}`}>{orderLabels[order.status] || order.status || "Tidak diketahui"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

    </section>
  );
}

function NavLink({ children, onClick }) {
  return <button type="button" onClick={onClick} className={`${focus} inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800`}>{children}<ArrowRight size={14} aria-hidden="true" /></button>;
}

export default DashboardAdmin;
