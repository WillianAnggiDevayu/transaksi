import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import UnitService from "../../services/UnitService";

const emptyForm = { unit_name: "", unit_code: "" };

function UnitPage() {
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await UnitService.getAll();
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat unit.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return units.filter((unit) =>
      `${unit.unit_name || ""} ${unit.unit_code || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [units, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  };

  const openEdit = (unit) => {
    setEditing(unit);
    setForm({
      unit_name: unit.unit_name || "",
      unit_code: unit.unit_code || "",
    });
    setError("");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        unit_name: form.unit_name.trim(),
        unit_code: form.unit_code.trim().toUpperCase(),
      };

      if (editing) {
        await UnitService.update(editing.unit_id, payload);
      } else {
        await UnitService.create(payload);
      }

      setOpen(false);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Gagal menyimpan unit.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (unit) => {
    if (!window.confirm(`Hapus unit "${unit.unit_name}"?`)) return;

    try {
      await UnitService.delete(unit.unit_id);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Unit tidak dapat dihapus.");
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Master Data</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Unit</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola satuan barang.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Tambah Unit
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
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari unit..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">No</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Nama Unit</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Kode</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-10 text-center text-sm text-slate-500">
                    Tidak ada unit.
                  </td>
                </tr>
              ) : (
                filtered.map((unit, index) => (
                  <tr key={unit.unit_id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">{unit.unit_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{unit.unit_code}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(unit)}
                          className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(unit)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
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
              {editing ? "Edit Unit" : "Tambah Unit"}
            </h2>

            <div className="mt-5 space-y-4">
              <input
                required
                maxLength={20}
                placeholder="Nama unit"
                value={form.unit_name}
                onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              <input
                required
                maxLength={5}
                placeholder="Kode unit"
                value={form.unit_code}
                onChange={(e) => setForm({ ...form, unit_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                Batal
              </button>
              <button disabled={saving} type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default UnitPage;
