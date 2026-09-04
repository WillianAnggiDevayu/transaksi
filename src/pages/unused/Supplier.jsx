import { useState } from "react";
import SupplierService from "../services/SupplierService";
import { confirmAction } from "../../services/ConfirmationService";

function Supplier({ supplier, setSupplier, user }) {
  const [search, setSearch] = useState("");

  const tambahSupplier = async () => {
    const nama = window.prompt("Nama Supplier");
    if (!nama) return;

    const telepon = window.prompt("No. Telepon", "");
    if (!telepon) return;

    const address = window.prompt("Alamat", "");
    if (address === null) return;

    try {
      const result = await SupplierService.create({
        supplier_name: nama,
        phone: telepon,
        address,
      });

      setSupplier(await SupplierService.getAll());

      if (result?.__offlineQueued) {
        alert(
          "Sedang offline. Supplier disimpan sementara dan akan otomatis " +
          "dikirim ke server saat koneksi tersedia kembali."
        );
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const editSupplier = async (item) => {
    const nama = window.prompt("Nama Supplier", item.nama);
    if (nama === null) return;

    const telepon = window.prompt("No. Telepon", item.telepon);
    if (telepon === null) return;

    const address = window.prompt(
      "Alamat",
      item.address || ""
    );

    if (address === null) return;

    try {
      await SupplierService.update(item.id, {
        supplier_name: nama,
        phone: telepon,
        address,
      });

      setSupplier(await SupplierService.getAll());
    } catch (err) {
      alert(err.message);
    }
  };

  const hapusSupplier = async (id) => {
    const confirmed = await confirmAction({
      title: "Hapus supplier?",
      message: "Supplier ini akan dihapus permanen dari sistem.",
    });

    if (!confirmed) return;

    try {
      await SupplierService.delete(id);
      setSupplier(await SupplierService.getAll());
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = supplier.filter((item) =>
    `${item.nama || ""} ${item.telepon || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">
            Daftar Supplier
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Kelola data supplier yang digunakan dalam transaksi pembelian.
          </p>
        </div>

        {user?.role === "admin" && (
          <button
            type="button"
            onClick={tambahSupplier}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Tambah Supplier
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Cari supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[650px] border-collapse text-left">

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-16 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                No
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nama Supplier
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                No. Telepon
              </th>

              <th className="w-40 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {index + 1}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-slate-800">
                    {item.nama}
                    {item._pendingSync && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-[2px] text-[10px] font-medium text-amber-600">
                        Menunggu sync
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {item.telepon}
                  </td>

                  <td className="px-5 py-4">
                    {user?.role === "admin" && !item._pendingSync && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => editSupplier(item)}
                          className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-600 transition hover:bg-amber-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => hapusSupplier(item.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    )}

                    {user?.role === "admin" && item._pendingSync && (
                      <div className="text-center text-xs text-slate-400">
                        Menunggu sinkronisasi
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  Tidak ada supplier yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default Supplier;
