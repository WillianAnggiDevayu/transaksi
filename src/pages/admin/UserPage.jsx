import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import UserService from "../../services/UserService";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role: "akuntan",
};

function UserPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await UserService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat user.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return users.filter((user) =>
      `${user.name || ""} ${user.email || ""} ${user.role || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [users, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      password_confirmation: "",
      role: user.role || "akuntan",
    });
    setError("");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        };

        if (form.password) {
          payload.password = form.password;
          payload.password_confirmation = form.password_confirmation;
        }

        // Backend mencegah admin mengubah role akun dirinya sendiri.
        await UserService.update(editing.id, payload);
      } else {
        await UserService.create({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          password_confirmation: form.password_confirmation,
          role: form.role,
        });
      }

      setOpen(false);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Gagal menyimpan user.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (user) => {
    if (user.id === currentUser?.id) {
      setError("Anda tidak dapat menghapus akun sendiri.");
      return;
    }

    if (!window.confirm(`Hapus user "${user.name}"?`)) return;

    try {
      await UserService.delete(user.id);
      await load();
    } catch (err) {
      setError(err?.data?.message || err.message || "Gagal menghapus user.");
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Master Data</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">User</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola akun admin, akuntan, dan supplier.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Tambah User
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
              placeholder="Cari user..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">No</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Nama</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Email</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Role</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">
                    Tidak ada user.
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">
                          Anda
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => openEdit(user)} className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100">
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={user.id === currentUser?.id}
                          onClick={() => remove(user)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30"
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
              {editing ? "Edit User" : "Tambah User"}
            </h2>

            <div className="mt-5 space-y-4">
              <input
                required
                placeholder="Nama"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="akuntan">Akuntan</option>
                <option value="supplier">Supplier</option>
              </select>

              <input
                required={!editing}
                type="password"
                placeholder={editing ? "Password baru (opsional)" : "Password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

              <input
                required={!editing || Boolean(form.password)}
                type="password"
                placeholder="Konfirmasi password"
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm({ ...form, password_confirmation: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>

            {editing && editing.id === currentUser?.id && (
              <p className="mt-4 text-xs text-amber-600">
                Role akun sendiri tidak dapat diubah oleh backend.
              </p>
            )}

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

export default UserPage;
