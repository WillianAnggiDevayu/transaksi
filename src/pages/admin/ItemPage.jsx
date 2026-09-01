import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import ItemService from "../../services/ItemService";
import UnitService from "../../services/UnitService";

const emptyForm = {
  item_name: "",
  stock: 0,
  unit_id: "",
};

function ItemPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [itemsData, unitsData] = await Promise.all([
        ItemService.getAll(),
        UnitService.getAll(),
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setUnits(Array.isArray(unitsData) ? unitsData : []);
    } catch (err) {
      setError(err.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return items.filter((item) => {
      const unit = units.find((unit) => unit.unit_id === item.unit_id);

      return `${item.item_name || ""} ${unit?.unit_code || ""}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [items, units, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      item_name: item.item_name || "",
      stock: item.stock ?? 0,
      unit_id: item.unit_id || "",
    });
    setError("");
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        item_name: form.item_name.trim(),
        stock: Number(form.stock),
        unit_id: form.unit_id,
      };

      if (editing) {
        // Backend UpdateItemRequest hanya menerima item_name dan unit_id.
        await ItemService.update(editing.item_id, {
          item_name: payload.item_name,
          unit_id: payload.unit_id,
        });
      } else {
        await ItemService.create(payload);
      }

      setOpen(false);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Gagal menyimpan barang.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Hapus barang "${item.item_name}"?`)) return;

    try {
      await ItemService.delete(item.item_id);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Gagal menghapus barang.");
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Master Data</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Barang</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola barang dan unit yang digunakan sistem.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Tambah Barang
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari barang..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">No</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Barang</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Unit</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Stok</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">
                    Tidak ada barang.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.item_id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                      {item.item_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {units.find((unit) => unit.unit_id === item.unit_id)?.unit_code || "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.stock}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item)}
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit Barang" : "Tambah Barang"}
            </h2>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Nama Barang</span>
                <input
                  required
                  maxLength={60}
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              {!editing && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Stok Awal</span>
                  <input
                    required
                    min="0"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Unit</span>
                <select
                  required
                  value={form.unit_id}
                  onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Pilih unit</option>
                  {units.map((unit) => (
                    <option key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name} ({unit.unit_code})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                disabled={saving}
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default ItemPage;
