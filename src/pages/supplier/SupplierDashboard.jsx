import {
  ClipboardList,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Clock3,
  ArrowRight,
} from "lucide-react";

function SupplierDashboard() {
  // DATA DUMMY
  const requestOrders = [
    {
      id: "REQ-001",
      tanggal: "2026-08-24",
      jumlahItem: 3,
      status: "pending",
    },
    {
      id: "REQ-002",
      tanggal: "2026-08-23",
      jumlahItem: 5,
      status: "quotation",
    },
    {
      id: "REQ-003",
      tanggal: "2026-08-22",
      jumlahItem: 2,
      status: "completed",
    },
  ];

  const purchaseOrders = [
    {
      id: "PO-001",
      tanggal: "2026-08-24",
      total: 1500000,
      status: "pending",
    },
    {
      id: "PO-002",
      tanggal: "2026-08-23",
      total: 2500000,
      status: "approved",
    },
    {
      id: "PO-003",
      tanggal: "2026-08-21",
      total: 850000,
      status: "completed",
    },
  ];

  // FORMAT RUPIAH
  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // STATUS REQUEST
  const getRequestStatusClass = (status) => {
    switch (status) {
      case "quotation":
        return "bg-blue-50 text-blue-700";
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  const getRequestStatusLabel = (status) => {
    switch (status) {
      case "quotation":
        return "Penawaran";

      case "completed":
        return "Selesai";

      default:
        return "Pending";
    }
  };

  // STATUS PO
  const getPOStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "bg-blue-50 text-blue-700";
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      case "cancelled":
        return "bg-red-50 text-red-700";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  const getPOStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "Disetujui";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Pending";
    }
  };
  // PERHITUNGAN DASHBOARD
  const requestBaru = requestOrders.filter(
    (item) => item.status === "pending"
  ).length;

  const menungguPenawaran = requestOrders.filter(
    (item) => item.status === "pending"
  ).length;

  const totalPO = purchaseOrders.length;

  const poSelesai = purchaseOrders.filter(
    (item) => item.status === "completed"
  ).length;

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

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

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

          </div>

          {/* PO PENDING */}

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShoppingCart size={17} />
              </div>

              <div>

                <p className="text-[12px] font-medium text-slate-700">
                  PO menunggu konfirmasi
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {
                    purchaseOrders.filter(
                      (item) => item.status === "pending"
                    ).length
                  }{" "}
                  purchase order
                </p>

              </div>

            </div>

            <span className="text-[11px] font-semibold text-blue-600">
              Proses
            </span>

          </div>

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

      {/* REQUEST ORDER TERBARU */}
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

            {requestOrders.map((item) => (

              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3 transition hover:bg-slate-50"
              >

                <div>

                  <p className="text-[12px] font-semibold text-slate-700">
                    {item.id}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {item.tanggal} · {item.jumlahItem} item
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

            {purchaseOrders.map((item) => (

              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3 transition hover:bg-slate-50"
              >

                <div>

                  <p className="text-[12px] font-semibold text-slate-700">
                    {item.id}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {item.tanggal}
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

          </div>

        </div>

      </div>

    </div>
  );
}

export default SupplierDashboard;