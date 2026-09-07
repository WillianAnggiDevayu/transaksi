import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Eye, Truck, X } from "lucide-react";
import PurchaseOrderService from "../../services/PurchaseOrderService";
import AuthService from "../../services/AuthService";
import { isOwner, localDate, dateOnly, shippingPayload } from "../../utils/procurement";
import { ErrorDetails } from "../../components/ProcurementDetails";
import { PackagingTable } from "../../components/ProcurementDetails";

const labels = { draft: "Draft", sent: "Dikirim", accepted: "Diterima", shipping: "Dikirim", delivered: "Barang Diterima", completed: "Selesai", failed: "Gagal", cancelled: "Dibatalkan" };
const badge = { accepted: "bg-blue-50 text-blue-700", delivered: "bg-emerald-50 text-emerald-700", completed: "bg-emerald-50 text-emerald-700", failed: "bg-red-50 text-red-700", cancelled: "bg-red-50 text-red-700" };
const rupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value || 0));
const displayDate = value => {
  const date = dateOnly(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
};
const paymentLabel = status => ({ unpaid: "Belum dibayar", partial: "Dibayar sebagian", paid: "Lunas" }[status] || status || "Belum dibayar");

function SupplierPurchaseOrder() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [dates, setDates] = useState(null);
  const [estimateOnly, setEstimateOnly] = useState(false);
  const user = AuthService.getUser();

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

  const open = async (order) => {
    setDates(null);
    try {
      const data = await PurchaseOrderService.getById(order.purchase_order_id);
      setSelected(data?.data || data);
      setError("");
    } catch (e) { setError(e.message || "Gagal memuat detail PO."); }
  };

  const markAsShipped = async event => {
    event.preventDefault();
    setStatusLoading(true);
    setError("");
    try {
      if (!isOwner(selected, user)) throw new Error("Anda bukan pemilik PO ini.");
      const payload = shippingPayload(selected, dates, estimateOnly);
      if (estimateOnly) await PurchaseOrderService.updateDeliveryEstimate(selected.purchase_order_id, payload);
      else await PurchaseOrderService.updateStatus(selected.purchase_order_id, "shipping", payload);
      setDates(null);
      await load();
      const data = await PurchaseOrderService.getById(selected.purchase_order_id);
      setSelected(data?.data || data);
    } catch (e) {
      setError([e.message, ...Object.values(e?.data?.errors || {}).flat()].filter(Boolean).join(" "));
    } finally {
      setStatusLoading(false);
    }
  };

  if (selected) {
    const details = selected.purchase_order_detail_purchase_order || selected.detail_purchase_orders || selected.details || [];
    return <section className="space-y-5">
      <div className="flex items-center gap-3"><button onClick={() => { setSelected(null); setDates(null); }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"><ArrowLeft size={17} /></button><div><p className="text-sm font-medium text-blue-600">Supplier</p><h1 className="mt-1 text-2xl font-bold">Detail Purchase Order</h1></div></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5"><h2 className="text-[15px] font-bold text-slate-900">Informasi Purchase Order</h2><p className="mt-1 text-xs text-slate-500">Ringkasan dokumen dan status pengiriman barang.</p></div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-3"><Info label="No. PO" value={selected.po_number} strong /><Info label="Purchase Request" value={selected.purchase_order_purchase_request?.request_number || selected.purchase_request_id || "-"} /><Info label="Tanggal Order" value={displayDate(selected.order_date)} /><Info label="Tanggal Pengiriman" value={displayDate(selected.shipping_date)} /><Info label="Estimasi Tiba" value={displayDate(selected.expected_delivery_date)} /><div><p className="text-xs font-medium text-slate-500">Status</p><span className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge[selected.status] || "bg-slate-100 text-slate-600"}`}>{labels[selected.status] || selected.status}</span></div><Info label="Pembayaran" value={paymentLabel(selected.payment_status)} /></div>
        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">Catatan</p><p className="mt-1.5 text-[13px] leading-5 text-slate-600">{selected.notes || "Tidak ada catatan."}</p></div>
        {isOwner(selected, user) && ["draft", "sent", "accepted"].includes(selected.status) && <button disabled={statusLoading} onClick={() => { setEstimateOnly(false); setError(""); setDates({ shipping_date: localDate(), expected_delivery_date: "" }); }} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50"><Truck size={16} />{statusLoading ? "Memproses..." : "Tandai PO Dikirim"}</button>}
      </div>

      {isOwner(selected, user) && selected.status === "shipping" && selected.shipping_date && <button className="rounded-lg bg-blue-50 px-4 py-2 text-blue-700" onClick={() => { setEstimateOnly(true); setError(""); setDates({ expected_delivery_date: dateOnly(selected.expected_delivery_date) }); }}>Ubah estimasi tiba</button>}
      {selected.status === "shipping" && !selected.shipping_date && <p className="text-sm text-amber-700">PO historis belum memiliki tanggal kirim. Perubahan estimasi memerlukan rekonsiliasi data.</p>}
      {dates && <form onSubmit={markAsShipped} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{estimateOnly ? <Clock3 size={19} /> : <Truck size={19} />}</span>
            <div><h2 className="text-base font-bold text-slate-900">{estimateOnly ? "Ubah estimasi tiba" : "Konfirmasi pengiriman barang"}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{estimateOnly ? "Perbarui perkiraan tanggal barang tiba di lokasi tujuan." : "Pastikan barang benar-benar diserahkan kepada pihak pengiriman hari ini."}</p></div>
          </div>
          <button type="button" onClick={() => setDates(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Tutup form pengiriman"><X size={18} /></button>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <ErrorDetails error={error} />
          <div className={`grid gap-5 ${estimateOnly ? "max-w-xl" : "md:grid-cols-2"}`}>
            {!estimateOnly && <div><p className="text-[13px] font-medium text-slate-700">Tanggal pengiriman aktual</p><div className="mt-1.5 flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"><CalendarDays size={17} className="text-blue-600" /><div><p className="text-[13px] font-semibold text-slate-800">Hari ini</p><p className="text-[11px] text-slate-500">{displayDate(dates.shipping_date)}</p></div></div><p className="mt-1.5 text-[11px] leading-4 text-slate-500">Tanggal dicatat otomatis saat status PO diubah menjadi Dikirim.</p></div>}
            <label className="block text-[13px] font-medium text-slate-700">Estimasi tiba<input required type="date" min={estimateOnly ? dateOnly(selected.shipping_date) : localDate()} value={dates.expected_delivery_date} onChange={e => setDates({ ...dates, expected_delivery_date: e.target.value })} className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><span className="mt-1.5 block text-[11px] leading-4 text-slate-500">Pilih perkiraan tanggal barang diterima oleh pembeli.</span></label>
          </div>
          {!estimateOnly && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">Setelah disimpan, status PO berubah menjadi <strong>Dikirim</strong>. Gunakan aksi ini hanya ketika barang sudah benar-benar dikirim.</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6"><button disabled={statusLoading} type="button" onClick={() => setDates(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Batal</button><button disabled={statusLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50">{statusLoading ? "Menyimpan..." : "Simpan"}</button></div>
      </form>}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="text-[15px] font-bold text-slate-800">Detail Barang</h2><p className="mt-1 text-xs text-slate-500">Rincian barang dan nilai akhir purchase order.</p></div>
        <div className="overflow-hidden rounded-lg border border-slate-200"><div className="overflow-x-auto"><PackagingTable lines={details} /></div></div>
        <div className="ml-auto mt-5 max-w-md overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between gap-5 text-[13px]"><span className="font-medium text-slate-500">Subtotal barang</span><span className="font-semibold tabular-nums text-blue-700">{rupiah(selected.subtotal)}</span></div>
            <div className="flex items-center justify-between gap-5 text-[13px]"><span className="font-medium text-slate-500">Diskon</span><span className="font-semibold tabular-nums text-rose-600">- {rupiah(selected.discount_amount)}</span></div>
          </div>
          <div className="flex items-center justify-between gap-5 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white"><span className="text-sm font-semibold text-blue-50">Total akhir</span><span className="text-base font-bold tabular-nums text-white">{rupiah(selected.total)}</span></div>
        </div>
      </div>
    </section>;
  }

  return <section className="space-y-5"><div><p className="text-sm font-medium text-blue-600">Supplier</p><h1 className="mt-1 text-2xl font-bold">Purchase Order</h1><p className="mt-1 text-sm text-slate-500">Purchase order yang ditujukan kepada supplier.</p></div>{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[850px]"><thead className="bg-slate-50"><tr>{["No", "No. PO", "Tanggal", "Estimasi Tiba", "Total", "Status", "Aksi"].map((title) => <th key={title} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">{title}</th>)}</tr></thead><tbody>{orders.map((order, index) => <tr key={order.purchase_order_id} className="border-t border-slate-100"><td className="px-5 py-4 text-sm">{index + 1}</td><td className="px-5 py-4 text-sm font-semibold">{order.po_number}</td><td className="px-5 py-4 text-sm">{order.order_date}</td><td className="px-5 py-4 text-sm">{order.expected_delivery_date || "-"}</td><td className="px-5 py-4 text-sm">{rupiah(order.total)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[order.status] || "bg-slate-100 text-slate-600"}`}>{labels[order.status] || order.status}</span></td><td className="px-5 py-4"><button onClick={() => open(order)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"><Eye size={14} /> Detail</button></td></tr>)}{!orders.length && <tr><td colSpan="7" className="px-5 py-10 text-center text-sm text-slate-400">Belum ada purchase order.</td></tr>}</tbody></table></div></div></section>;
}

function Info({ label, value, strong = false }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-sm ${strong ? "font-semibold" : ""}`}>{value}</p></div>;
}

export default SupplierPurchaseOrder;
