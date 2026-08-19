import { useState } from "react";
import ItemService from "../services/ItemService";
import formatRupiah from "../utils/formatRupiah";

import BarangFormModal from "../pages/modal/BarangFormModal";
import DeleteBarangModal from "../pages/modal/DeleteBarangModal";

function Barang({ barang, setBarang, user }) {
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [form, setForm] = useState({
    item_name: "",
    stock: 0,
    item_price: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bukaTambahBarang = () => {
    setEditingItem(null);
    setForm({ item_name: "", stock: 0, item_price: 0 });
    setError("");
    setShowForm(true);
  };

  const bukaEditBarang = (item) => {
    setEditingItem(item);
    setForm({
      item_name: item.nama || "",
      stock: item.stok ?? 0,
      item_price: item.harga ?? 0,
    });
    setError("");
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.item_name.trim()) {
      setError("Nama barang wajib diisi.");
      return;
    }

    if (Number(form.stock) < 0) {
      setError("Stok tidak boleh kurang dari 0.");
      return;
    }

    if (Number(form.item_price) < 0) {
      setError("Harga tidak boleh kurang dari 0.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        item_name: form.item_name.trim(),
        stock: Number(form.stock),
        item_price: Number(form.item_price),
      };

      let result;

      if (editingItem) {
        result = await ItemService.update(editingItem.id, payload);
      } else {
        result = await ItemService.create(payload);
      }

      setBarang(await ItemService.getAll());
      setShowForm(false);
      setEditingItem(null);

      if (result?.__offlineQueued) {
        alert(
          "Sedang offline. Barang disimpan sementara dan akan otomatis " +
          "dikirim ke server saat koneksi tersedia kembali."
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Gagal menyimpan barang."
      );
    } finally {
      setLoading(false);
    }
  };

  const bukaHapusBarang = (item) => {
    setDeletingItem(item);
    setError("");
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    setLoading(true);
    setError("");

    try {
      await ItemService.delete(deletingItem.id);
      setBarang(await ItemService.getAll());
      setShowDeleteConfirm(false);
      setDeletingItem(null);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Gagal menghapus barang."
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = barang.filter((item) =>
    `${item.nama || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.03)]">

        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-[16px] font-semibold text-slate-900">
            Daftar Barang
          </h3>

          {user?.role === "admin" && (
            <button
              className="rounded-lg bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-4 py-[9px] text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition hover:-translate-y-[1px] hover:shadow-[0_7px_18px_rgba(37,99,235,0.25)]"
              onClick={bukaTambahBarang}
            >
              + Tambah Barang
            </button>
          )}
        </div>

        {/* SEARCH */}
        <div className="mb-5">
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-[10px] text-[12px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                  No
                </th>

                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                  Nama Barang
                </th>

                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                  Harga
                </th>

                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                  Stok
                </th>

                <th className="border-b border-gray-200 bg-slate-50 px-3 py-[13px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="border-b border-gray-200 px-3 py-[13px] text-[12px] text-slate-700">
                    {index + 1}
                  </td>

                  <td className="border-b border-gray-200 px-3 py-[13px] text-[12px] text-slate-700">
                    {item.nama}
                    {item._pendingSync && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-[2px] text-[10px] font-medium text-amber-600">
                        Menunggu sync
                      </span>
                    )}
                  </td>

                  <td className="border-b border-gray-200 px-3 py-[13px] text-[12px] text-slate-700">
                    {item.harga == null
                      ? "-"
                      : formatRupiah(item.harga)}
                  </td>

                  <td className="border-b border-gray-200 px-3 py-[13px] text-[12px] text-slate-700">
                    {item.stok}
                  </td>

                  <td className="border-b border-gray-200 px-3 py-[13px]">
                    {user?.role === "admin" && !item._pendingSync && (
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-md bg-blue-50 px-3 py-[6px] text-[11px] font-medium text-blue-600 transition hover:bg-blue-100"
                          onClick={() => bukaEditBarang(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="rounded-md bg-red-50 px-3 py-[6px] text-[11px] font-medium text-red-600 transition hover:bg-red-100"
                          onClick={() => bukaHapusBarang(item)}
                        >
                          Hapus
                        </button>
                      </div>
                    )}

                    {user?.role === "admin" && item._pendingSync && (
                      <span className="text-[11px] text-slate-400">
                        Menunggu sinkronisasi
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-3 py-8 text-center text-[12px] text-slate-400"
                  >
                    Data barang tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <BarangFormModal
        show={showForm}
        editingItem={editingItem}
        form={form}
        loading={loading}
        error={error}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
          setError("");
        }}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />

      <DeleteBarangModal
        show={showDeleteConfirm}
        item={deletingItem}
        loading={loading}
        error={error}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingItem(null);
          setError("");
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}

export default Barang;