import { useState } from "react";
import { Eye, Plus, X, Percent } from "lucide-react";

function RequestOrder() {
  const [showQuotation, setShowQuotation] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [discounts, setDiscounts] = useState({});
  const [packageDiscount, setPackageDiscount] = useState(0);
  const [catatan, setCatatan] = useState("");

  // DATA REQUEST ORDER
  const requestOrders = [
    {
      id: "REQ-001",
      tanggal: "2026-08-24",
      peminta: "Admin",
      jumlahItem: 3,
      status: "pending",
      items: [
        {
          nama: "Laptop",
          qty: 2,
          harga: 5000000,
        },
        {
          nama: "Keyboard",
          qty: 3,
          harga: 500000,
        },
        {
          nama: "Mouse",
          qty: 3,
          harga: 250000,
        },
      ],
    },
    {
      id: "REQ-002",
      tanggal: "2026-08-23",
      peminta: "Admin",
      jumlahItem: 2,
      status: "approved",
      items: [
        {
          nama: "Monitor",
          qty: 2,
          harga: 2500000,
        },
        {
          nama: "Keyboard",
          qty: 5,
          harga: 500000,
        },
      ],
    },
    {
      id: "REQ-003",
      tanggal: "2026-08-22",
      peminta: "Admin",
      jumlahItem: 2,
      status: "completed",
      items: [
        {
          nama: "Printer",
          qty: 2,
          harga: 3000000,
        },
        {
          nama: "Tinta Printer",
          qty: 4,
          harga: 350000,
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

  // BUKA FORM PENAWARAN
  const handleCreateQuotation = (request) => {
    setSelectedRequest(request);
    const initialDiscount = {};
    request.items.forEach((item) => {
      initialDiscount[item.nama] = 0;
    });

    setDiscounts(initialDiscount);
    setPackageDiscount(0);
    setCatatan("");
    setShowQuotation(true);
  };

  // DISKON ITEM
  const handleDiscountChange = (itemName, value) => {
    let discount = Number(value);
    if (discount < 0) discount = 0;
    if (discount > 100) discount = 100;
    setDiscounts((prev) => ({
      ...prev,
      [itemName]: discount,
    }));
  };

  // DISKON PACKAGE
  const handlePackageDiscountChange = (value) => {
    let discount = Number(value);
    if (discount < 0) discount = 0;
    if (discount > 100) discount = 100;
    setPackageDiscount(discount);
  };

  // TOTAL HARGA NORMAL
  const calculateNormalTotal = () => {
    if (!selectedRequest) return 0;
    return selectedRequest.items.reduce((total, item) => {
      return total + item.qty * item.harga;
    }, 0);
  };

  // TOTAL DISKON ITEM
  const calculateItemDiscountTotal = () => {
    if (!selectedRequest) return 0;
    return selectedRequest.items.reduce((total, item) => {
      const subtotal = item.qty * item.harga;
      const discount = discounts[item.nama] || 0;
      return total + subtotal * (discount / 100);
    }, 0);
  };

  // SUBTOTAL SETELAH DISKON ITEM
  const calculateSubtotalAfterItemDiscount = () => {
    return calculateNormalTotal() - calculateItemDiscountTotal();
  };

  // NILAI DISKON PACKAGE
  const calculatePackageDiscountTotal = () => {
    const subtotal = calculateSubtotalAfterItemDiscount();
    return subtotal * (packageDiscount / 100);
  };

  // TOTAL PENAWARAN
  const calculateQuotationTotal = () => {
    return (
      calculateSubtotalAfterItemDiscount() -
      calculatePackageDiscountTotal()
    );
  };

  // KIRIM PENAWARAN
  const handleSubmitQuotation = () => {
    if (!selectedRequest) return;
    const quotationData = {
      requestId: selectedRequest.id,
      diskonItem: discounts,
      diskonPackage: packageDiscount,
      totalNormal: calculateNormalTotal(),
      totalDiskonItem: calculateItemDiscountTotal(),
      subtotal: calculateSubtotalAfterItemDiscount(),
      totalDiskonPackage: calculatePackageDiscountTotal(),
      totalPenawaran: calculateQuotationTotal(),
      catatan: catatan,
    };

    console.log("Data Penawaran:", quotationData);
    alert("Penawaran berhasil dikirim.");
    setShowQuotation(false);
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-[22px]">

      {/* HEADER */}
      <div>
        <h1 className="text-[20px] font-semibold text-slate-900">
          Request Order
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Daftar permintaan order yang diterima supplier.
        </p>
      </div>

      {/* TABLE REQUEST ORDER */}
      <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">
        <div className="mb-5">
          <h3 className="text-[16px] font-semibold text-slate-900">
            Daftar Request Order
          </h3>
          <p className="mt-1 text-[12px] text-slate-500">
            Informasi permintaan barang dari perusahaan.
          </p>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">No</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">No. Request</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Tanggal</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Peminta</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Jumlah Item</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Status</th>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-center text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {requestOrders.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200 transition-colors hover:bg-blue-50/50">
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">{index + 1}</td>
                  <td className="px-3 py-[13px] text-[12px] font-medium text-slate-700">{item.id}</td>
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">{item.tanggal}</td>
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">{item.peminta}</td>
                  <td className="px-3 py-[13px] text-[12px] text-slate-700">{item.jumlahItem}</td>
                  <td className="px-3 py-[13px]">

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold
                        ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>

                  <td className="px-3 py-[13px] text-center">
                    <button
                      type="button"
                      onClick={() => handleCreateQuotation(item)}
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-lg
                        bg-blue-50
                        px-3
                        py-1.5
                        text-[11px]
                        font-semibold
                        text-blue-600
                        transition
                        hover:bg-blue-100">
                      <Eye size={14} /> Detail / Penawaran
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARD TAMBAH PENAWARAN */}
      <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">Penawaran Harga</h3>
            <p className="mt-1 text-[12px] text-slate-500">Buat penawaran harga berdasarkan request order yang diterima.</p>
          </div>

          <button
            type="button"
            onClick={() => handleCreateQuotation(requestOrders[0])}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-blue-600
              px-4
              py-2
              text-[12px]
              font-semibold
              text-white
              transition
              hover:bg-blue-700">
            <Plus size={16} /> Tambah Penawaran
          </button>
        </div>
      </div>

      {/* MODAL PENAWARAN */}
      {showQuotation && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-[950px] overflow-y-auto rounded-[14px] bg-white shadow-xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900">Buat Penawaran</h2>
                <p className="mt-1 text-[12px] text-slate-500">Request Order: {selectedRequest.id}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowQuotation(false)}
                className="
                  rounded-lg
                  p-2
                  text-slate-500
                  hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-6 px-6 py-5">

              {/* INFORMASI REQUEST */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[11px] text-slate-500">No. Request</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-800">{selectedRequest.id}</p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500">Tanggal</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-800">{selectedRequest.tanggal}</p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500">Peminta</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-800">{selectedRequest.peminta}</p>
                </div>
              </div>

              {/* TABEL BARANG */}
              <div>
                <h3 className="mb-3 text-[14px] font-semibold text-slate-900">Daftar Barang</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold text-slate-500">Barang</th>
                        <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-500">Qty</th>
                        <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-right text-[11px] font-semibold text-slate-500">Harga</th>
                        <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-500">Diskon Item</th>
                        <th className="border-b border-gray-200 bg-slate-50 px-3 py-3 text-right text-[11px] font-semibold text-slate-500">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedRequest.items.map((item) => {
                        const discount = discounts[item.nama] || 0;
                        const subtotalNormal = item.qty * item.harga;
                        const discountValue = subtotalNormal * (discount / 100);
                        const subtotalAfterDiscount = subtotalNormal - discountValue;
                        return (

                          <tr
                            key={item.nama}
                            className="border-b border-gray-200">
                            <td className="px-3 py-3 text-[12px] text-slate-700">{item.nama}</td>
                            <td className="px-3 py-3 text-center text-[12px] text-slate-700">{item.qty}</td>
                            <td className="px-3 py-3 text-right text-[12px] text-slate-700">{formatRupiah(item.harga)}</td>
                            <td className="px-3 py-3">
                              <div className="relative mx-auto w-[100px]">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={discount}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    handleDiscountChange(
                                      item.nama,
                                      e.target.value
                                    )
                                  }
                                  onBlur={() => {
                                    if (discount === "") {
                                      handleDiscountChange(item.nama, "0");
                                    }
                                  }}
                                  className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-gray-300
                                    py-2
                                    pl-3
                                    pr-8
                                    text-center
                                    text-[12px]
                                    outline-none
                                    focus:border-blue-500
                                    focus:ring-1
                                    focus:ring-blue-500"/>

                                <Percent
                                  size={13}
                                  className="
                                    absolute
                                    right-2
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400"/>
                              </div>
                            </td>

                            <td className="px-3 py-3 text-right text-[12px] font-medium text-slate-700">{formatRupiah(subtotalAfterDiscount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RINGKASAN HARGA */}
              <div className="ml-auto w-full max-w-[500px] overflow-hidden rounded-lg border border-gray-200 bg-white">

                {/* Total Harga Normal */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-slate-600">Total Harga Normal</span>
                  <span className="text-[12px] font-medium text-slate-700">{formatRupiah(calculateNormalTotal())}</span>
                </div>

                {/* Total Diskon Item */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-slate-600">Total Diskon Item</span>
                  <span className="text-[12px] font-medium text-red-600">
                    - {formatRupiah(calculateItemDiscountTotal())}</span>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                  <span className="text-[12px] font-medium text-slate-700">Subtotal</span>
                  <span className="text-[12px] font-semibold text-slate-800">
                    {formatRupiah(
                      calculateSubtotalAfterItemDiscount()
                    )}</span>
                </div>

                {/* Diskon Package */}
                <div className="flex items-center justify-between bg-blue-50/50 px-4 py-3">
                  <div>
                    <span className="text-[12px] font-medium text-slate-700">Diskon Package</span>
                    <p className="mt-0.5 text-[10px] text-slate-500">Diskon tambahan untuk seluruh pembelian</p>
                  </div>
                  <div className="relative w-[110px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={packageDiscount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handlePackageDiscountChange(e.target.value)
                      }
                      onBlur={() => {
                        if (packageDiscount === "") {
                          handlePackageDiscountChange("0");
                        }
                      }}
                      className="
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        py-2
                        pl-3
                        pr-8
                        text-center
                        text-[12px]
                        outline-none
                        focus:border-blue-500
                        focus:ring-1
                        focus:ring-blue-500"/>

                    <Percent
                      size={13}
                      className="
                        absolute
                        right-2
                        top-1/2
                        -translate-y-1/2
                        text-slate-400"/>

                  </div>
                </div>

                {/* Nilai Diskon Package */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-slate-600">Nilai Diskon Package ({packageDiscount}%)</span>
                  <span className="text-[12px] font-medium text-red-600">
                    - {formatRupiah(
                      calculatePackageDiscountTotal()
                    )}</span>
                </div>

                {/* Total Penawaran */}
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4">
                  <span className="text-[14px] font-semibold text-slate-900">Total Penawaran</span>
                  <span className="text-[15px] font-bold text-slate-900">
                    {formatRupiah(calculateQuotationTotal())}</span>
                </div>
              </div>

              {/* CATATAN */}
              <div>
                <label className="mb-2 block text-[12px] font-medium text-slate-700">Catatan Penawaran</label>
                <textarea
                  rows="3"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Harga sudah termasuk biaya pengiriman."
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-3
                    py-2.5
                    text-[12px]
                    text-slate-700
                    outline-none
                    focus:border-blue-500
                    focus:ring-1
                    focus:ring-blue-500"/>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowQuotation(false)}
                className="
                  rounded-lg
                  border
                  border-gray-300
                  px-4
                  py-2
                  text-[12px]
                  font-semibold
                  text-slate-600
                  transition
                  hover:bg-slate-50">
                Batal</button>

              <button
                type="button"
                onClick={handleSubmitQuotation}
                className="
                  rounded-lg
                  bg-blue-600
                  px-4
                  py-2
                  text-[12px]
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-700">
                Kirim Penawaran</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestOrder;