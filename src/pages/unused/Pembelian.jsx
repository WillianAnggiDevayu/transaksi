import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import TransactionService from "../services/TransactionService";
import formatRupiah from "../utils/formatRupiah";

function Pembelian({ supplier, barang, setPembelian }) {
  const [supplierDipilih, setSupplierDipilih] = useState("");
  const [tanggalPembelian, setTanggalPembelian] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [items, setItems] = useState([
    {
      id: 0,
      barangId: "",
      harga: "",
      jumlah: 0,
    },
  ]);

  const handleBarangChange = (index, barangId) => {
    const barangDipilih = barang.find((item) => item.id === barangId);

    setItems((currentItems) => {
      const newItems = [...currentItems];

      newItems[index] = {
        ...newItems[index],
        barangId,
        harga: barangDipilih?.harga ?? "",
      };

      return newItems;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((currentItems) => {
      const newItems = [...currentItems];

      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      return newItems;
    });
  };

  const tambahBarang = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        id:
          currentItems.reduce(
            (highestId, item) => Math.max(highestId, item.id),
            0
          ) + 1,
        barangId: "",
        harga: "",
        jumlah: 0,
      },
    ]);
  };

  const hapusBarang = (index) => {
    if (items.length === 1) return;

    setItems((currentItems) =>
      currentItems.filter((_, i) => i !== index)
    );
  };

  const hitungSubtotal = (item) =>
    Number(item.harga || 0) * Number(item.jumlah || 0);

  const totalPembelian = items.reduce(
    (total, item) => total + hitungSubtotal(item),
    0
  );

  const handleSimpanPembelian = async () => {
    if (!supplierDipilih) {
      alert("Silakan pilih supplier terlebih dahulu.");
      return;
    }

    if (!tanggalPembelian) {
      alert("Silakan pilih tanggal pembelian terlebih dahulu.");
      return;
    }

    if (items.some((item) => !item.barangId)) {
      alert("Silakan pilih barang terlebih dahulu.");
      return;
    }

    if (items.some((item) => Number(item.jumlah) <= 0)) {
      alert("Jumlah barang harus lebih dari 0.");
      return;
    }

    if (items.some((item) => Number(item.harga) < 0)) {
      alert("Harga barang tidak valid.");
      return;
    }

    const supplierDipilihObj = supplier.find(
      (item) => item.id === supplierDipilih
    );

    const details = items.map((item) => {
      const barangDipilih = barang.find((b) => b.id === item.barangId);

      return {
        item_id: item.barangId,
        item_quant: Number(item.jumlah),
        item_price: Number(item.harga),

        // Field tambahan di bawah ini HANYA dipakai untuk tampilan optimistic
        // ketika transaksi tersimpan offline (menunggu sinkronisasi).
        // Backend Laravel mengabaikan field yang tidak divalidasi, jadi aman dikirim.
        subtotal: Number(item.harga) * Number(item.jumlah),
        item_name: barangDipilih?.nama,
      };
    });

    try {
      const result = await TransactionService.create({
        supplier_id: supplierDipilih,
        supplier_name: supplierDipilihObj?.nama, // display-only, lihat catatan di atas
        tr_date: tanggalPembelian,
        payment_method: paymentMethod,
        details,
      });

      if (result?.__offlineQueued) {
        alert(
          `Sedang offline. Transaksi disimpan sementara di perangkat ini\n` +
          `dan akan otomatis dikirim ke server saat koneksi tersedia kembali.\n` +
          `Total: ${formatRupiah(totalPembelian)}`
        );
      } else {
        alert(
          `Pembelian berhasil disimpan sebagai transaksi pending.\nTotal: ${formatRupiah(
            totalPembelian
          )}`
        );
      }

      const transactions = await TransactionService.getAll();
      setPembelian(transactions);

      setSupplierDipilih("");
      setTanggalPembelian("");
      setPaymentMethod("");

      setItems([
        {
          id: 0,
          barangId: "",
          harga: "",
          jumlah: 0,
        },
      ]);
    } catch (err) {
      console.error("Gagal membuat transaksi:", err);

      alert(err?.message || "Gagal menyimpan transaksi.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">
            Transaksi Pembelian
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Tambahkan barang yang ingin dibeli dari supplier.
          </p>
        </div>
      </div>

      {/* INFORMASI PEMBELIAN */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* SUPPLIER */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            Supplier
          </label>

          <select
            value={supplierDipilih}
            onChange={(e) => setSupplierDipilih(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Pilih Supplier</option>

            {supplier.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nama}
              </option>
            ))}
          </select>
        </div>

        {/* TANGGAL */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            Tanggal Pembelian
          </label>

          <input
            type="date"
            value={tanggalPembelian}
            onChange={(e) => setTanggalPembelian(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* PAYMENT */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            Metode Pembayaran
          </label>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Pilih Metode</option>
            <option value="cash">Cash</option>
            <option value="cashless">Cashless</option>
          </select>
        </div>
      </div>

      {/* DETAIL */}
      <div className="overflow-hidden rounded-xl border border-slate-200">

        {/* DETAIL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h4 className="font-semibold text-slate-800">
              Detail Barang
            </h4>

            <span className="text-sm text-slate-500">
              Tambahkan satu atau beberapa barang.
            </span>
          </div>

          <button
            type="button"
            onClick={tambahBarang}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Tambah Barang
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">

            {/* TABLE HEADER */}
            <div className="grid grid-cols-[60px_2fr_1.2fr_1fr_1.3fr_70px] items-center gap-4 border-b border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>No</div>
              <div>Barang</div>
              <div>Harga</div>
              <div>Jumlah</div>
              <div>Subtotal</div>
              <div className="text-center">Aksi</div>
            </div>

            {/* TABLE ROW */}
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[60px_2fr_1.2fr_1fr_1.3fr_70px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
              >
                <div className="text-sm font-medium text-slate-600">
                  {index + 1}
                </div>

                <select
                  value={item.barangId}
                  onChange={(e) =>
                    handleBarangChange(index, e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Pilih Barang</option>

                  {barang.map((barangItem) => (
                    <option key={barangItem.id} value={barangItem.id}>
                      {barangItem.nama}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  placeholder="Harga"
                  value={item.harga}
                  onChange={(e) =>
                    handleItemChange(index, "harga", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <input
                  type="number"
                  min="0"
                  value={item.jumlah}
                  onChange={(e) =>
                    handleItemChange(index, "jumlah", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="font-semibold text-slate-700">
                  {formatRupiah(hitungSubtotal(item))}
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => hapusBarang(index)}
                    disabled={items.length === 1}
                    title={
                      items.length === 1
                        ? "Minimal satu barang"
                        : "Hapus barang"
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOTAL */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-5">
          <span className="text-sm font-medium text-slate-600">
            Total Pembelian
          </span>

          <strong className="text-xl font-bold text-slate-800">
            {formatRupiah(totalPembelian)}
          </strong>
        </div>

        {/* ACTION */}
        <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleSimpanPembelian}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Simpan Pembelian
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pembelian;
