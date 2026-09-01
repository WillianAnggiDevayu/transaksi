import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import SupplierService from "../../services/SupplierService";
import UserService from "../../services/UserService";

const emptyForm = {
  user_id: "",
  supplier_name: "",
  phone: "",
  address: "",
};

function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [supplierData, userData] = await Promise.all([
        SupplierService.getAll(),
        UserService.getAll(),
      ]);

      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      setError(err.message || "Gagal memuat data supplier.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const supplierUserIds = new Set(
    suppliers.map((supplier) => supplier.user_id).filter(Boolean)
  );

  const availableSupplierUsers = users.filter(
    (user) =>
      user.role === "supplier" &&
      (!supplierUserIds.has(user.id) || user.id === editing?.user_id)
  );

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return suppliers.filter((supplier) =>
      `${supplier.supplier_name || ""} ${supplier.phone || ""} ${supplier.address || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [suppliers, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      user_id: supplier.user_id || "",
      supplier_name: supplier.supplier_name || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
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
        user_id: form.user_id,
        supplier_name: form.supplier_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (editing) {
        await SupplierService.update(editing.supplier_id, payload);
      } else {
        await SupplierService.create(payload);
      }

      setOpen(false);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Gagal menyimpan supplier.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (supplier) => {
    if (!window.confirm(`Hapus supplier "${supplier.supplier_name}"?`)) return;

    try {
      await SupplierService.delete(supplier.supplier_id);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Gagal menghapus supplier.");
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Master Data</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Supplier</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data supplier dan akun supplier.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Tambah Supplier
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
              placeholder="Cari supplier..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">No</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Supplier</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Telepon</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Alamat</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">
                    Tidak ada supplier.
                  </td>
                </tr>
              ) : (
                filtered.map((supplier, index) => (
                  <tr key={supplier.supplier_id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                      {supplier.supplier_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{supplier.phone}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{supplier.address}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => openEdit(supplier)} className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => remove(supplier)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100">
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
              {editing ? "Edit Supplier" : "Tambah Supplier"}
            </h2>

            <div className="mt-5 space-y-4">
              <select
                required
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Pilih akun supplier</option>
                {availableSupplierUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>

              <input
                required
                maxLength={50}
                placeholder="Nama supplier"
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

              <input
                required
                maxLength={15}
                placeholder="Nomor telepon"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

              <textarea
                required
                maxLength={200}
                placeholder="Alamat"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
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

export default SupplierPage;
