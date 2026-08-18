import { useState } from "react";
import { Eye, Check, X, XCircle } from "lucide-react";

import formatRupiah from "../utils/formatRupiah";
import formatTanggal from "../utils/formatTanggal";
import TransactionService from "../services/TransactionService";

function Dashboard({
  supplier,
  barang,
  pembelian,
  setPembelian,
}) {
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // CARI NAMA SUPPLIER
  // =========================

  const getSupplierName = (supplierId) => {
    const found = supplier.find(
      (item) => item.id === supplierId
    );

    return found?.nama || "-";
  };

  // =========================
  // NORMALIZE DETAIL TRANSAKSI
  // =========================

  const normalizeTransaction = (response) => {
    // Jika service mengembalikan:
    // { message: "...", data: {...} }
    //
    // maka ambil response.data

    const raw = response?.data || response;

    return {
      id: raw.tr_id,

      supplier_id: raw.supplier_id,

      supplier_name:
        raw.mstransactions_suppliers?.supplier_name ||
        getSupplierName(raw.supplier_id),

      tanggal: raw.tr_date,

      payment_method: raw.payment_method,

      total: raw.total,

      status: raw.status,

      details: (
        raw.mstransactions_detail_transactions || []
      ).map((detail) => ({
        tr_detail_id: detail.tr_detail_id,

        item_id: detail.item_id,

        item_name:
          detail.item_detail_transactions?.item_name ||
          getItemName(detail.item_id),

        item_quant: detail.item_quant,

        item_price: detail.item_price,

        subtotal: detail.subtotal,
      })),
    };
  };

  // =========================
  // CARI NAMA BARANG
  // =========================

  const getItemName = (itemId) => {
    const found = barang.find(
      (item) => item.id === itemId
    );

    return found?.nama || "-";
  };

  // =========================
  // BUKA DETAIL
  // =========================

  const openDetail = async (transaction) => {
    setError("");
    setLoading(true);

    try {
      const response =
        await TransactionService.getById(
          transaction.id || transaction.tr_id
        );

      const normalized =
        normalizeTransaction(response);

      setSelectedTransaction(normalized);
    } catch (err) {
      console.error(err);

      setSelectedTransaction({
        id:
          transaction.id ||
          transaction.tr_id,

        supplier_id:
          transaction.supplier_id,

        supplier_name:
          transaction.supplier_name ||
          getSupplierName(
            transaction.supplier_id
          ),

        tanggal:
          transaction.tanggal ||
          transaction.tr_date,

        total: transaction.total || 0,

        status:
          transaction.status || "pending",

        details: [],
      });

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Gagal mengambil detail transaksi."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TUTUP DETAIL
  // =========================

  const closeDetail = () => {
    if (loading) return;

    setSelectedTransaction(null);
    setError("");
  };

  // =========================
  // UPDATE STATUS
  // =========================

  const updateStatus = async (action) => {
    if (!selectedTransaction) return;

    setLoading(true);
    setError("");

    try {
      if (action === "complete") {
        await TransactionService.complete(
          selectedTransaction.id
        );
      }

      if (action === "cancel") {
        await TransactionService.cancel(
          selectedTransaction.id
        );
      }

      // Ambil data terbaru setelah status berubah
      const response =
        await TransactionService.getById(
          selectedTransaction.id
        );

      const updated =
        normalizeTransaction(response);

      setSelectedTransaction(updated);

      // Refresh tabel dashboard
      const latestTransactions =
        await TransactionService.getAll();

      setPembelian(latestTransactions);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Gagal mengubah status transaksi."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      case "pending":
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  // =========================
  // STATUS LABEL
  // =========================

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Selesai";

      case "cancelled":
        return "Dibatalkan";

      case "pending":
      default:
        return "Pending";
    }
  };

  return (
    <>
      <div className="space-y-[22px]">

        {/* ========================= */}
        {/* WELCOME */}
        {/* ========================= */}

        <div className="relative overflow-hidden rounded-[13px] bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-[22px] py-[21px] text-white">
          <h2 className="relative z-10 mb-2 text-[20px] font-semibold">
            Selamat Datang
          </h2>

          <p className="relative z-10 text-[13px] text-blue-100">
            Kelola data pembelian melalui sistem ini.
          </p>
        </div>

        {/* ========================= */}
        {/* CARDS */}
        {/* ========================= */}

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">

          {/* SUPPLIER */}

          <div className="flex items-center gap-[15px] rounded-[13px] border border-gray-200 bg-white p-[21px] shadow-sm transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)]">

            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[11px] bg-blue-50 text-[21px]">
              👥
            </span>

            <div>
              <p className="mb-[5px] text-[12px] text-slate-500">
                Total Supplier
              </p>

              <h2 className="text-[23px] font-semibold text-slate-900">
                {supplier.length}
              </h2>
            </div>

          </div>

          {/* BARANG */}

          <div className="flex items-center gap-[15px] rounded-[13px] border border-gray-200 bg-white p-[21px] shadow-sm transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)]">

            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[11px] bg-blue-50 text-[21px]">
              📦
            </span>

            <div>
              <p className="mb-[5px] text-[12px] text-slate-500">
                Total Barang
              </p>

              <h2 className="text-[23px] font-semibold text-slate-900">
                {barang.length}
              </h2>
            </div>

          </div>

          {/* PEMBELIAN */}

          <div className="flex items-center gap-[15px] rounded-[13px] border border-gray-200 bg-white p-[21px] shadow-sm transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)]">

            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[11px] bg-blue-50 text-[21px]">
              🛒
            </span>

            <div>
              <p className="mb-[5px] text-[12px] text-slate-500">
                Total Pembelian
              </p>

              <h2 className="text-[23px] font-semibold text-slate-900">
                {pembelian.length}
              </h2>
            </div>

          </div>

        </div>

        {/* ========================= */}
        {/* TRANSAKSI */}
        {/* ========================= */}

        <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h3 className="text-[16px] font-semibold text-slate-900">
                Transaksi Pembelian Terbaru
              </h3>

              <p className="mt-1 text-[12px] text-slate-500">
                Klik transaksi untuk melihat detail.
              </p>

            </div>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[750px] border-collapse">

              <thead>

                <tr>

                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                    No
                  </th>

                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                    Tanggal
                  </th>

                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                    Supplier
                  </th>

                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                    Total
                  </th>

                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                    Status
                  </th>

                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-center text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody>

                {pembelian.map((item, index) => (

                  <tr
                    key={item.id || item.tr_id}
                    onClick={() => openDetail(item)}
                    className="cursor-pointer border-b border-gray-200 transition-colors hover:bg-blue-50/50"
                  >

                    <td className="px-3 py-[13px] text-[12px] text-slate-700">
                      {index + 1}
                    </td>

                    <td className="px-3 py-[13px] text-[12px] text-slate-700">
                      {formatTanggal(
                        item.tanggal ||
                        item.tr_date
                      )}
                    </td>

                    <td className="px-3 py-[13px] text-[12px] font-medium text-slate-700">
                      {item.supplier_name ||
                        getSupplierName(
                          item.supplier_id
                        )}
                    </td>

                    <td className="px-3 py-[13px] text-[12px] font-medium text-slate-700">
                      {formatRupiah(item.total)}
                    </td>

                    <td className="px-3 py-[13px]">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(
                          item.status
                        )}
                      </span>

                    </td>

                    <td
                      className="px-3 py-[13px] text-center"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >

                      <button
                        type="button"
                        onClick={() =>
                          openDetail(item)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-100"
                      >
                        <Eye size={14} />
                        Detail
                      </button>

                    </td>

                  </tr>

                ))}

                {pembelian.length === 0 && (

                  <tr>

                    <td
                      colSpan="6"
                      className="px-3 py-8 text-center text-[12px] text-slate-500"
                    >
                      Belum ada transaksi pembelian.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ========================= */}
      {/* DETAIL MODAL */}
      {/* ========================= */}

      {selectedTransaction && (

        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-slate-900">
                  Detail Transaksi
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedTransaction.id}
                </p>

              </div>

              <button
                type="button"
                onClick={closeDetail}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* ERROR */}

            {error && (

              <div className="mx-6 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>

            )}

            {/* INFO */}

            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 px-6 py-5 md:grid-cols-4">

              <div>

                <p className="text-[11px] text-slate-500">
                  Tanggal
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatTanggal(
                    selectedTransaction.tanggal
                  )}
                </p>

              </div>

              <div>

                <p className="text-[11px] text-slate-500">
                  Supplier
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedTransaction.supplier_name ||
                    "-"}
                </p>

              </div>

              <div>

                <p className="text-[11px] text-slate-500">
                  Status
                </p>

                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                    selectedTransaction.status
                  )}`}
                >
                  {getStatusLabel(
                    selectedTransaction.status
                  )}
                </span>

              </div>

              <div>

                <p className="text-[11px] text-slate-500">
                  Total
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatRupiah(
                    selectedTransaction.total
                  )}
                </p>

              </div>

            </div>

            {/* DETAIL BARANG */}

            <div className="max-h-[350px] overflow-y-auto px-6 py-5">

              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Daftar Barang
              </h3>

              <div className="overflow-hidden rounded-xl border border-slate-200">

                <table className="w-full border-collapse">

                  <thead>

                    <tr className="bg-slate-50">

                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-slate-500">
                        Barang
                      </th>

                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase text-slate-500">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase text-slate-500">
                        Harga
                      </th>

                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase text-slate-500">
                        Subtotal
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {selectedTransaction.details.map(
                      (detail, index) => (

                        <tr
                          key={
                            detail.tr_detail_id ||
                            index
                          }
                          className="border-t border-slate-100"
                        >

                          <td className="px-4 py-3 text-sm text-slate-700">
                            {detail.item_name}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-700">
                            {detail.item_quant}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-700">
                            {formatRupiah(
                              detail.item_price
                            )}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                            {formatRupiah(
                              detail.subtotal
                            )}
                          </td>

                        </tr>

                      )
                    )}

                    {selectedTransaction.details.length ===
                      0 && (

                        <tr>

                          <td
                            colSpan="4"
                            className="px-4 py-8 text-center text-sm text-slate-500"
                          >
                            Detail transaksi tidak tersedia.
                          </td>

                        </tr>

                      )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">

              <div>

                <p className="text-xs text-slate-500">
                  Total transaksi
                </p>

                <p className="text-lg font-semibold text-slate-900">
                  {formatRupiah(
                    selectedTransaction.total
                  )}
                </p>

              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={closeDetail}
                  disabled={loading}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Tutup
                </button>

                {selectedTransaction.status ===
                  "pending" && (
                    <>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          updateStatus("cancel")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={15} />

                        {loading
                          ? "Memproses..."
                          : "Batalkan"}
                      </button>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          updateStatus("complete")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check size={15} />

                        {loading
                          ? "Memproses..."
                          : "Selesaikan"}
                      </button>

                    </>
                  )}

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default Dashboard;