import { useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";

function PurchaseOrder() {
  const [selectedPO, setSelectedPO] = useState(null);

  // DATA PURCHASE ORDER
  const purchaseOrders = [
    {
      id: "PO-001",
      purchaseRequest: "PR-001",
      supplier: "PT Supplier ABC",
      noPenawaran: "QTN-001",
      dibuatOleh: "Admin",
      tanggalOrder: "2026-08-24",
      estimasiTiba: "2026-08-28",
      subtotal: 12250000,
      diskonTotal: 10,
      diskonAmount: 1225000,
      total: 11025000,
      status: "pending",
      statusPembayaran: "Belum Dibayar",
      note: "Barang diharapkan tiba sesuai estimasi.",
      items: [
        {
          kode: "BRG-001",
          nama: "Laptop",
          qty: 2,
          satuan: "Unit",
          harga: 5000000,
          diskon: 5,
          subtotal: 9500000,
        },
        {
          kode: "BRG-002",
          nama: "Mouse",
          qty: 5,
          satuan: "Unit",
          harga: 250000,
          diskon: 0,
          subtotal: 1250000,
        },
        {
          kode: "BRG-003",
          nama: "Keyboard",
          qty: 3,
          satuan: "Unit",
          harga: 500000,
          diskon: 0,
          subtotal: 1500000,
        },
      ],
    },

    {
      id: "PO-002",
      purchaseRequest: "PR-002",
      supplier: "PT Supplier ABC",
      noPenawaran: "QTN-002",
      dibuatOleh: "Admin",
      tanggalOrder: "2026-08-23",
      estimasiTiba: "2026-08-27",
      subtotal: 2500000,
      diskonTotal: 5,
      diskonAmount: 125000,
      total: 2375000,
      status: "approved",
      statusPembayaran: "Belum Dibayar",
      note: "Pesanan telah disetujui dan menunggu proses pengiriman.",
      items: [
        {
          kode: "BRG-004",
          nama: "Monitor",
          qty: 2,
          satuan: "Unit",
          harga: 1250000,
          diskon: 0,
          subtotal: 2500000,
        },
      ],
    },

    {
      id: "PO-003",
      purchaseRequest: "PR-003",
      supplier: "PT Supplier ABC",
      noPenawaran: "QTN-003",
      dibuatOleh: "Admin",
      tanggalOrder: "2026-08-21",
      estimasiTiba: "2026-08-25",
      subtotal: 850000,
      diskonTotal: 0,
      diskonAmount: 0,
      total: 850000,
      status: "completed",
      statusPembayaran: "Sudah Dibayar",
      note: "Pesanan telah selesai diterima.",
      items: [
        {
          kode: "BRG-005",
          nama: "Kabel HDMI",
          qty: 5,
          satuan: "Pcs",
          harga: 170000,
          diskon: 0,
          subtotal: 850000,
        },
      ],
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

  // STATUS
  const getStatusClass = (status) => {
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

  const getStatusLabel = (status) => {
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

  // DETAIL PURCHASE ORDER
  if (selectedPO) {
    return (
      <div className="space-y-[22px]">

        {/* HEADER DETAIL */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedPO(null)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 transition hover:bg-slate-50">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-[20px] font-semibold text-slate-900">Detail Purchase Order</h1>
            <p className="mt-1 text-[13px] text-slate-500">Informasi detail purchase order.</p>
          </div>
        </div>

        {/* INFORMASI PURCHASE ORDER */}
        <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">
          <div className="mb-5">
            <h3 className="text-[16px] font-semibold text-slate-900">Informasi Purchase Order</h3>
            <p className="mt-1 text-[12px] text-slate-500">Informasi umum mengenai purchase order.</p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">

            {/* NO PO */}
            <div>
              <p className="text-[11px] text-slate-500">No. PO</p>
              <p className="mt-1 text-[13px] font-semibold text-slate-800">{selectedPO.id}</p>
            </div>

            {/* NO PURCHASE REQUEST */}
            <div>
              <p className="text-[11px] text-slate-500">No. Purchase Request</p>
              <p className="mt-1 text-[13px] font-medium text-slate-800">{selectedPO.purchaseRequest}</p>
            </div>

            {/* SUPPLIER */}
            <div>
              <p className="text-[11px] text-slate-500">Supplier</p>
              <p className="mt-1 text-[13px] font-medium text-slate-800">{selectedPO.supplier}</p>
            </div>

            {/* NO PENAWARAN */}
            <div>
              <p className="text-[11px] text-slate-500">No. Penawaran</p>
              <p className="mt-1 text-[13px] font-medium text-slate-800">{selectedPO.noPenawaran}</p>
            </div>

            {/* DIBUAT OLEH */}
            <div>
              <p className="text-[11px] text-slate-500">Dibuat Oleh</p>
              <p className="mt-1 text-[13px] font-medium text-slate-800">{selectedPO.dibuatOleh}</p>
            </div>

            {/* TANGGAL ORDER */}
            <div>
              <p className="text-[11px] text-slate-500">Tanggal Order</p>
              <p className="mt-1 text-[13px] font-medium text-slate-800">{selectedPO.tanggalOrder}</p>
            </div>

            {/* ESTIMASI TIBA */}
            <div>
              <p className="text-[11px] text-slate-500">Estimasi Tiba</p>
              <p className="mt-1 text-[13px] font-medium text-slate-800">{selectedPO.estimasiTiba}</p>
            </div>

            {/* STATUS */}
            <div>
              <p className="text-[11px] text-slate-500">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(selectedPO.status)}`}>
                {getStatusLabel(selectedPO.status)}
              </span>
            </div>

            {/* STATUS PEMBAYARAN */}
            <div>
              <p className="text-[11px] text-slate-500">Status Pembayaran</p>
              <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                {selectedPO.statusPembayaran}
              </span>
            </div>

            {/* NOTE */}
            <div className="md:col-span-2">
              <p className="text-[11px] text-slate-500">Note</p>
              <div className="mt-1 rounded-lg bg-slate-50 px-3 py-3 text-[12px] text-slate-600">
                {selectedPO.note}
              </div>
            </div>
          </div>
        </div>

        {/* RINGKASAN HARGA */}
        <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">
          <div className="mb-5">
            <h3 className="text-[16px] font-semibold text-slate-900">Ringkasan Harga</h3>
            <p className="mt-1 text-[12px] text-slate-500">Ringkasan nilai purchase order.</p>
          </div>

          <div className="ml-auto w-full max-w-[500px]">

            {/* SUBTOTAL */}
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3">
              <span className="text-[12px] text-slate-600">Subtotal</span>
              <span className="text-[12px] font-medium text-slate-700">{formatRupiah(selectedPO.subtotal)}</span>
            </div>

            {/* DISKON TOTAL */}
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3">
              <span className="text-[12px] text-slate-600">Diskon Total ({selectedPO.diskonTotal}%)</span>
              <span className="text-[12px] font-medium text-red-600">
                - {formatRupiah(selectedPO.diskonAmount)}</span>
            </div>

            {/* TOTAL */}
            <div className="flex items-center justify-between border-t border-gray-200 px-3 py-4">
              <span className="text-[14px] font-semibold text-slate-900">Total</span>
              <span className="text-[16px] font-bold text-slate-900">
                {formatRupiah(selectedPO.total)}
              </span>
            </div>
          </div>
        </div>

        {/* DETAIL BARANG */}
        <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">
          <div className="mb-5">
            <h3 className="text-[16px] font-semibold text-slate-900">Detail Barang yang Dibeli</h3>
            <p className="mt-1 text-[12px] text-slate-500">Daftar barang yang terdapat dalam purchase order.</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold text-slate-500">No</th>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold text-slate-500">Kode Barang</th>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold text-slate-500">Barang</th>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-500">Qty</th>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-500">Satuan</th>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-right text-[11px] font-semibold text-slate-500">Harga</th>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-500">Diskon</th>
                  <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-right text-[11px] font-semibold text-slate-500">Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {selectedPO.items.map((item, index) => (
                  <tr
                    key={item.kode}
                    className="border-b border-gray-200">
                    <td className="px-3 py-3 text-[12px] text-slate-700">{index + 1}</td>
                    <td className="px-3 py-3 text-[12px] font-medium text-slate-700">{item.kode}</td>
                    <td className="px-3 py-3 text-[12px] text-slate-700">{item.nama}</td>
                    <td className="px-3 py-3 text-center text-[12px] text-slate-700">{item.qty}</td>
                    <td className="px-3 py-3 text-center text-[12px] text-slate-700">{item.satuan}</td>
                    <td className="px-3 py-3 text-right text-[12px] text-slate-700">
                      {formatRupiah(item.harga)}</td>
                    <td className="px-3 py-3 text-center text-[12px] text-slate-700">
                      {item.diskon}%</td>
                    <td className="px-3 py-3 text-right text-[12px] font-medium text-slate-700">
                      {formatRupiah(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // DAFTAR PURCHASE ORDER
  return (
    <div className="space-y-[22px]">

      {/* HEADER */}
      <div>
        <h1 className="text-[20px] font-semibold text-slate-900">Purchase Order</h1>
        <p className="mt-1 text-[13px] text-slate-500">Daftar purchase order yang diterima oleh supplier.</p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">

        {/* TOTAL PO */}
        <div className="rounded-[13px] border border-gray-200 bg-white p-[20px] shadow-sm">
          <p className="text-[12px] text-slate-500">Total PO</p>
          <h2 className="mt-1 text-[23px] font-semibold text-slate-900">
            {purchaseOrders.length}</h2>
        </div>

        {/* PO PENDING */}
        <div className="rounded-[13px] border border-gray-200 bg-white p-[20px] shadow-sm">
          <p className="text-[12px] text-slate-500">PO Pending</p>
          <h2 className="mt-1 text-[23px] font-semibold text-slate-900">
            {
              purchaseOrders.filter(
                (item) => item.status === "pending"
              ).length
            }
          </h2>
        </div>

        {/* TOTAL NILAI PO */}
        <div className="rounded-[13px] border border-gray-200 bg-white p-[20px] shadow-sm">
          <p className="text-[12px] text-slate-500">Total Nilai PO</p>
          <h2 className="mt-1 text-[20px] font-semibold text-slate-900">
            {formatRupiah(
              purchaseOrders.reduce(
                (total, item) => total + item.total,
                0
              )
            )}
          </h2>
        </div>
      </div>

      {/* TABLE PURCHASE ORDER */}
      <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">
        <div className="mb-5">
          <h3 className="text-[16px] font-semibold text-slate-900">Daftar Purchase Order</h3>
          <p className="mt-1 text-[12px] text-slate-500">Informasi purchase order yang ditujukan kepada supplier.</p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">No</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">No. PO</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">No. Purchase Request</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Supplier</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Tanggal Order</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-right text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Total</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Status</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-center text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {purchaseOrders.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 transition-colors hover:bg-blue-50/50">
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">
                    {index + 1}</td>
                  <td className="px-3 py-[13px] text-[12px] font-medium text-slate-700">
                    {item.id}</td>
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">
                    {item.purchaseRequest}</td>
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">
                    {item.supplier}</td>
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">
                    {item.tanggalOrder}</td>
                  <td className="px-3 py-[13px] text-right text-[12px] font-medium text-slate-700">
                    {formatRupiah(item.total)}</td>
                  <td className="px-3 py-[13px]">

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                        item.status
                      )}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>

                  <td className="px-3 py-[13px] text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedPO(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-100">
                      <Eye size={14} />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}

              {purchaseOrders.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-3 py-8 text-center text-[12px] text-slate-500">Belum ada purchase order.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PurchaseOrder;