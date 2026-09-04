import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import ItemService from "../../services/ItemService";
import UnitService from "../../services/UnitService";
import useCachedList from "../../hooks/useCachedList";
import { confirmAction } from "../../services/ConfirmationService";

function ItemPage() {
  const {
    data: itemsData,
    loading: itemsLoading,
  } = useCachedList("items", ItemService);

  const {
    data: unitsData,
    loading: unitsLoading,
  } = useCachedList("units", UnitService);

  const items = useMemo(
    () => (Array.isArray(itemsData) ? itemsData : []),
    [itemsData]
  );
  const units = useMemo(
    () => (Array.isArray(unitsData) ? unitsData : []),
    [unitsData]
  );

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    item_name: "",
    stock: "",
    unit_id: "",
  });

  const loading = itemsLoading || unitsLoading;

  /*
   * Buat lookup unit berdasarkan unit_id.
   *
   * Contoh:
   * unit_id 1 -> "Kilogram"
   * unit_id 2 -> "Liter"
   */
  const unitMap = useMemo(() => {
    const map = new Map();

    units.forEach((unit) => {
      map.set(String(unit.unit_id), unit);
    });

    return map;
  }, [units]);

  /*
   * Normalisasi item untuk kebutuhan tampilan.
   *
   * ItemService menyediakan unit_id, sedangkan nama satuan
   * diambil dari cache units.
   */
  const displayItems = useMemo(() => {
    return items.map((item) => {
      const unit = unitMap.get(String(item.unit_id));

      return {
        ...item,
        display_code: unit?.unit_code || "-",
        display_unit: unit?.unit_name || "-",
      };
    });
  }, [items, unitMap]);

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return displayItems;
    }

    return displayItems.filter((item) =>
      `${item.item_name || ""} ${item.display_code || ""} ${item.display_unit || ""
        }`
        .toLowerCase()
        .includes(keyword)
    );
  }, [displayItems, search]);

  const openCreate = () => {
    setEditingItem(null);

    setForm({
      item_name: "",
      stock: "",
      unit_id: "",
    });

    setError("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);

    setForm({
      item_name: item.item_name || "",
      stock: item.stock ?? "",
      unit_id: item.unit_id || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);

    setForm({
      item_name: "",
      stock: "",
      unit_id: "",
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        item_name: form.item_name.trim(),
        stock: Number(form.stock),
        unit_id: form.unit_id,
      };

      if (editingItem) {
        await ItemService.update(
          editingItem.item_id,
          payload
        );
      } else {
        await ItemService.create(payload);
      }

      closeModal();
    } catch (err) {
      setError(
        err?.data?.message ||
        err?.message ||
        "Gagal menyimpan item."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmAction({
      title: "Hapus item?",
      message: `Item "${item.item_name}" akan dihapus permanen dari sistem.`,
    });

    if (!confirmed) return;

    setError("");

    try {
      await ItemService.delete(item.item_id);
    } catch (err) {
      setError(
        err?.data?.message ||
        err?.message ||
        "Gagal menghapus item."
      );
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Master Data
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Barang
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola data item dan satuan barang.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Tambah Item
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari item..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  No
                </th>



                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Nama Item
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Stok
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Satuan
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                  Kode
                </th>

                <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Tidak ada item.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={item.item_id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                      {item.item_name}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.stock ?? 0}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.display_unit}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.display_code}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(item)
                          }
                          className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(item)
                          }
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-slate-900">
              {editingItem
                ? "Edit Item"
                : "Tambah Item"}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nama Item
                </label>

                <input
                  required
                  maxLength={100}
                  value={form.item_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      item_name: e.target.value,
                    })
                  }
                  placeholder="Nama item"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Stok
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock: e.target.value,
                    })
                  }
                  placeholder="Stok"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Satuan
                </label>

                <select
                  required
                  value={form.unit_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unit_id: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    Pilih satuan
                  </option>

                  {units.map((unit) => (
                    <option
                      key={unit.unit_id}
                      value={unit.unit_id}
                    >
                      {unit.unit_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                disabled={saving}
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default ItemPage;
