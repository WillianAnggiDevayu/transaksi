import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Clock3,
  ArrowRight,
} from "lucide-react";
import SupplierQuotationService from "../../services/SupplierQuotationService";
import PurchaseOrderService from "../../services/PurchaseOrderService";

// FORMAT RUPIAH
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

// STATUS REQUEST SUPPLIER (status asli dari backend: pending, accepted, rejected, selected, not_selected)
const getRequestStatusClass = (status) => {
  switch (status) {
    case "accepted":
      return "bg-blue-50 text-blue-700";
    case "selected":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
    case "not_selected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

const getRequestStatusLabel = (status) => {
  switch (status) {
    case "accepted":
      return "Diterima";
    case "selected":
      return "Terpilih";
    case "rejected":
      return "Ditolak";
    case "not_selected":
      return "Tidak Terpilih";
    default:
      return "Menunggu Respons";
  }
};

// STATUS PO (status asli dari backend: draft, sent, accepted, shipping, delivered, completed, failed, cancelled)
const getPOStatusClass = (status) => {
  switch (status) {
    case "accepted":
    case "sent":
      return "bg-blue-50 text-blue-700";
    case "shipping":
      return "bg-violet-50 text-violet-700";
    case "delivered":
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

const getPOStatusLabel = (status) => {
  switch (status) {
    case "sent":
      return "Dikirim";
    case "accepted":
      return "Diterima";
    case "shipping":
      return "Pengiriman";
    case "delivered":
      return "Barang Diterima";
    case "completed":
      return "Selesai";
    case "failed":
      return "Gagal";
    case "cancelled":
      return "Dibatalkan";
    default:
      return "Draft";
  }
};

function SupplierDashboard({ onNavigate }) {
  const [requestOrders, setRequestOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [requests, orders] = await Promise.all([
        SupplierQuotationService.getAll(),
        PurchaseOrderService.getAll(),
      ]);

      setRequestOrders(Array.isArray(requests) ? requests : []);
      setPurchaseOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      setError(
        err?.data?.message ||
        err.message ||
        "Gagal memuat data dashboard supplier."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(load, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  // PERHITUNGAN DASHBOARD
  const requestBaru = useMemo(
    () => requestOrders.filter((item) => item.status === "pending").length,
    [requestOrders]
  );

  // Request yang sudah diterima supplier tapi belum dibuatkan quotation
  const menungguPenawaran = useMemo(
    () =>
      requestOrders.filter(
        (item) =>
          item.status === "accepted" &&
          !item.request_supplier_supplier_quotation
      ).length,
    [requestOrders]
  );

  const totalPO = purchaseOrders.length;

  const poPending = useMemo(
    () =>
      purchaseOrders.filter((item) =>
        ["draft", "sent"].includes(item.status)
      ).length,
    [purchaseOrders]
  );

  const poSelesai = useMemo(
    () =>
      purchaseOrders.filter((item) => item.status === "completed").length,
    [purchaseOrders]
  );

  // TERBARU (diurutkan tanggal terbaru, ambil 5)
  const latestRequestOrders = useMemo(() => {
    return [...requestOrders]
      .sort(
        (a, b) =>
          new Date(b.sent_at || 0).getTime() -
          new Date(a.sent_at || 0).getTime()
      )
      .slice(0, 5);
  }, [requestOrders]);

  const latestPurchaseOrders = useMemo(() => {
    return [...purchaseOrders]
      .sort(
        (a, b) =>
          new Date(b.order_date || 0).getTime() -
          new Date(a.order_date || 0).getTime()
      )
      .slice(0, 5);
  }, [purchaseOrders]);

  const itemCount = (row) =>
    row.request_supplier_purchase_request
      ?.purchase_request_detail_purchase_request?.length || 0;

  const requestNumber = (row) =>
    row.request_supplier_purchase_request?.request_number ||
    row.purchase_request_id ||
    "-";

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-[22px]">

      {/* HEADER */}
      <div>
        <h1 className="text-[20px] font-semibold text-slate-900">
          Dashboard Supplier
        </h1>

        <p className="mt-1 text-[13px] text-slate-500">
          Ringkasan aktivitas request order dan purchase order.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* STATISTIK */}

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">

        {/* REQUEST BARU */}

        <div className="rounded-[13px] border border-gray-200 bg-white p-[20px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-slate-500">
                Request Baru
              </p>

              <h2 className="mt-1 text-[23px] font-semibold text-slate-900">
                {requestBaru}
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Request yang perlu diproses
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ClipboardList size={19} />
            </div>

          </div>

        </div>

        {/* MENUNGGU PENAWARAN */}

        <div className="rounded-[13px] border border-gray-200 bg-white p-[20px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-[12px] text-slate-500">
                Menunggu Penawaran
              </p>

              <h2 className="mt-1 text-[23px] font-semibold text-slate-900">
                {menungguPenawaran}
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Belum dibuat quotation
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FileText size={19} />
            </div>

          </div>

        </div>

        {/* TOTAL PO */}

        <div className="rounded-[13px] border border-gray-200 bg-white p-[20px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-[12px] text-slate-500">
                Purchase Order
              </p>

              <h2 className="mt-1 text-[23px] font-semibold text-slate-900">
                {totalPO}
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Total purchase order
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <ShoppingCart size={19} />
            </div>

          </div>

        </div>

        {/* PO SELESAI */}

        <div className="rounded-[13px] border border-gray-200 bg-white p-[20px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-[12px] text-slate-500">
                PO Selesai
              </p>

              <h2 className="mt-1 text-[23px] font-semibold text-slate-900">
                {poSelesai}
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Purchase order selesai
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={19} />
            </div>

          </div>

        </div>

      </div>

      {/* PERLU TINDAKAN */}
      <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">

        <div className="mb-5">

          <h3 className="text-[16px] font-semibold text-slate-900">
            Perlu Tindakan
          </h3>

          <p className="mt-1 text-[12px] text-slate-500">
            Aktivitas yang perlu diperhatikan oleh supplier.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* REQUEST */}

          <button
            type="button"
            onClick={() => onNavigate?.("requestOrder")}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition hover:bg-slate-50"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock3 size={17} />
              </div>

              <div>

                <p className="text-[12px] font-medium text-slate-700">
                  Request menunggu penawaran
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {menungguPenawaran} request
                </p>

              </div>

            </div>

            <span className="text-[11px] font-semibold text-blue-600">
              Proses
            </span>

          </button>

          {/* PO PENDING */}

          <button
            type="button"
            onClick={() => onNavigate?.("purchaseOrder")}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition hover:bg-slate-50"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShoppingCart size={17} />
              </div>

              <div>

                <p className="text-[12px] font-medium text-slate-700">
                  PO menunggu konfirmasi
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {poPending} purchase order
                </p>

              </div>

            </div>

            <span className="text-[11px] font-semibold text-blue-600">
              Proses
            </span>

          </button>

          {/* PO SELESAI */}

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={17} />
              </div>

              <div>

                <p className="text-[12px] font-medium text-slate-700">
                  Purchase order selesai
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {poSelesai} purchase order
                </p>

              </div>

            </div>

            <span className="text-[11px] font-semibold text-emerald-600">
              Selesai
            </span>

          </div>

        </div>

      </div>

      {/* REQUEST ORDER & PURCHASE ORDER TERBARU */}
      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2">

        <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h3 className="text-[16px] font-semibold text-slate-900">
                Request Order Terbaru
              </h3>

              <p className="mt-1 text-[12px] text-slate-500">
                Request order terbaru dari perusahaan.
              </p>

            </div>

            <span className="text-[11px] font-semibold text-blue-600">
              Terbaru
            </span>

          </div>

          <div className="space-y-2">

            {latestRequestOrders.map((item) => (

              <div
                key={item.request_supplier_id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3 transition hover:bg-slate-50"
              >

                <div>

                  <p className="text-[12px] font-semibold text-slate-700">
                    {requestNumber(item)}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {item.sent_at || "-"} · {itemCount(item)} item
                  </p>

                </div>

                <div className="flex items-center gap-3">

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getRequestStatusClass(
                      item.status
                    )}`}
                  >
                    {getRequestStatusLabel(item.status)}
                  </span>

                  <ArrowRight
                    size={15}
                    className="text-slate-400"
                  />

                </div>

              </div>

            ))}

            {latestRequestOrders.length === 0 && (
              <p className="py-6 text-center text-[12px] text-slate-400">
                Belum ada request order.
              </p>
            )}

          </div>

        </div>

        {/* PURCHASE ORDER TERBARU */}
        <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h3 className="text-[16px] font-semibold text-slate-900">
                Purchase Order Terbaru
              </h3>

              <p className="mt-1 text-[12px] text-slate-500">
                Purchase order terbaru yang diterima.
              </p>

            </div>

            <span className="text-[11px] font-semibold text-blue-600">
              Terbaru
            </span>

          </div>

          <div className="space-y-2">

            {latestPurchaseOrders.map((item) => (

              <div
                key={item.purchase_order_id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3 transition hover:bg-slate-50"
              >

                <div>

                  <p className="text-[12px] font-semibold text-slate-700">
                    {item.po_number}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {item.order_date}
                  </p>

                </div>

                <div className="flex items-center gap-3">

                  <div className="text-right">

                    <p className="text-[12px] font-medium text-slate-700">
                      {formatRupiah(item.total)}
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getPOStatusClass(
                        item.status
                      )}`}
                    >
                      {getPOStatusLabel(item.status)}
                    </span>

                  </div>

                  <ArrowRight
                    size={15}
                    className="text-slate-400"
                  />

                </div>

              </div>

            ))}

            {latestPurchaseOrders.length === 0 && (
              <p className="py-6 text-center text-[12px] text-slate-400">
                Belum ada purchase order.
              </p>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default SupplierDashboard;
