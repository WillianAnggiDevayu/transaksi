import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import SupplierService from "../../services/SupplierService";
import UserService from "../../services/UserService";
import useCachedList from "../../hooks/useCachedList";
import { confirmAction } from "../../services/ConfirmationService";

const emptyForm = {
    // Akun Supplier
    name: "",
    email: "",
    password: "",
    password_confirmation: "",

    // Data Supplier
    supplier_name: "",
    phone: "",
    address: "",
};

function SupplierPage() {
    // Data Supplier
    const {
        data: suppliersData,
        loading: suppliersLoading,
    } = useCachedList("suppliers", SupplierService);

    const suppliers = useMemo(
        () => (Array.isArray(suppliersData) ? suppliersData : []),
        [suppliersData]
    );

    // Data User
    const {
        data: usersData,
        loading: usersLoading,
    } = useCachedList("users", UserService);

    const users = Array.isArray(usersData)
        ? usersData
        : [];

    // State
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loading = suppliersLoading || usersLoading;

    // Filter Supplier
    const filtered = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return suppliers.filter((supplier) =>
            `${supplier.supplier_name || ""} ${
                supplier.phone || ""
            } ${supplier.address || ""}`
                .toLowerCase()
                .includes(keyword)
        );
    }, [suppliers, search]);

    // Buka Tambah Supplier
    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError("");
        setOpen(true);
    };

    // Buka Edit Supplier
    const openEdit = (supplier) => {
        setEditing(supplier);

        // Cari akun user berdasarkan user_id
        const supplierUser = users.find(
            (user) =>
                String(user.id) === String(supplier.user_id)
        );

        setForm({
            // Akun User
            name: supplierUser?.name || "",
            email: supplierUser?.email || "",
            password: "",
            password_confirmation: "",

            // Data Supplier
            supplier_name: supplier.supplier_name || "",
            phone: supplier.phone || "",
            address: supplier.address || "",
        });

        setError("");
        setOpen(true);
    };

    // Tutup Modal
    const closeModal = () => {
        if (saving) return;

        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        setError("");
    };

    // Ambil User ID
    const getCreatedUserId = (response) => {
        // Menyesuaikan beberapa kemungkinan bentuk response dari UserService.
        return (
            response?.id ||
            response?.user_id ||
            response?.data?.id ||
            response?.data?.user_id ||
            response?.data?.data?.id ||
            response?.data?.data?.user_id ||
            null
        );
    };

    // Submit Form
    const submit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError("");

        try {
            // Validasi Akun
            if (!editing) {
                if (!form.name.trim()) {
                    throw new Error(
                        "Nama user wajib diisi."
                    );
                }

                if (!form.email.trim()) {
                    throw new Error(
                        "Email user wajib diisi."
                    );
                }

                if (!form.password) {
                    throw new Error(
                        "Password wajib diisi."
                    );
                }

                if (
                    form.password !==
                    form.password_confirmation
                ) {
                    throw new Error(
                        "Konfirmasi password tidak sama."
                    );
                }
            }

            // Validasi Supplier
            if (!form.supplier_name.trim()) {
                throw new Error(
                    "Nama supplier wajib diisi."
                );
            }

            if (!form.phone.trim()) {
                throw new Error(
                    "Nomor telepon wajib diisi."
                );
            }

            if (!form.address.trim()) {
                throw new Error(
                    "Alamat wajib diisi."
                );
            }

            // Edit Supplier
            if (editing) {
                // Update data supplier
                await SupplierService.update(
                    editing.supplier_id,
                    {
                        user_id: editing.user_id || null,
                        supplier_name:
                            form.supplier_name.trim(),
                        phone: form.phone.trim(),
                        address: form.address.trim(),
                    }
                );

                // Cari akun user supplier
                const supplierUser = users.find(
                    (user) =>
                        String(user.id) ===
                        String(editing.user_id)
                );

                // Update akun user jika ada perubahan
                if (
                    supplierUser &&
                    (
                        form.name.trim() !==
                            (supplierUser.name || "") ||
                        form.email.trim() !==
                            (supplierUser.email || "") ||
                        form.password
                    )
                ) {
                    const userPayload = {
                        name: form.name.trim(),
                        email: form.email.trim(),
                        role: "supplier",
                    };

                    // Update password jika diisi
                    if (form.password) {
                        if (
                            form.password !==
                            form.password_confirmation
                        ) {
                            throw new Error(
                                "Konfirmasi password tidak sama."
                            );
                        }

                        userPayload.password =
                            form.password;

                        userPayload.password_confirmation =
                            form.password_confirmation;
                    }

                    await UserService.update(
                        supplierUser.id,
                        userPayload
                    );
                }

                closeModal();
                return;
            }

            // Tambah User Supplier
            const userResponse =
                await UserService.create({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    password_confirmation:
                        form.password_confirmation,

                    // Role otomatis supplier
                    role: "supplier",
                });

            // Ambil User ID
            let userId =
                getCreatedUserId(userResponse);

            // Jika ID tidak ada di response, ambil ulang daftar user berdasarkan email.
            if (!userId) {
                try {
                    const latestUsers =
                        await UserService.getAll();

                    const createdUser =
                        Array.isArray(latestUsers)
                            ? latestUsers.find(
                                  (user) =>
                                      String(
                                          user.email
                                      ).toLowerCase() ===
                                      form.email
                                          .trim()
                                          .toLowerCase()
                              )
                            : null;

                    userId =
                        createdUser?.id ||
                        createdUser?.user_id ||
                        null;
                } catch (userError) {
                    console.error(
                        "Gagal mengambil user terbaru:",
                        userError
                    );
                }
            }

            // User ID Tidak Ditemukan
            if (!userId) {
                throw new Error(
                    "Akun supplier berhasil dibuat, tetapi user_id tidak ditemukan. Periksa response UserService."
                );
            }

            // Tambah Data Supplier
            await SupplierService.create({
                user_id: userId,
                supplier_name:
                    form.supplier_name.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
            });

            // Selesai
            closeModal();
        } catch (err) {
            console.error(err);

            setError(
                err?.data?.message ||
                    err?.response?.data?.message ||
                    err?.message ||
                    "Gagal menyimpan supplier."
            );
        } finally {
            setSaving(false);
        }
    };

    // Hapus Supplier
    const remove = async (supplier) => {
        const confirmed = await confirmAction({
            title: "Hapus supplier?",
            message: `Supplier "${supplier.supplier_name}" akan dihapus permanen dari sistem.`,
        });

        if (!confirmed) return;

        setError("");

        try {
            await SupplierService.delete(
                supplier.supplier_id
            );
        } catch (err) {
            setError(
                err?.data?.message ||
                    err?.response?.data?.message ||
                    err?.message ||
                    "Gagal menghapus supplier."
            );
        }
    };

    // Render
    return (
        <section>
            {/* Header */}
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-medium text-blue-600">
                        Master Data
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Supplier
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Kelola data supplier dan akun supplier.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    <Plus size={17} />
                    Tambah Supplier
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Table Supplier */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Search */}
                <div className="border-b border-slate-200 p-4">
                    <div className="relative max-w-md">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Cari supplier..."
                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
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
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-5 py-10 text-center text-sm text-slate-500">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-5 py-10 text-center text-sm text-slate-500">
                                        Tidak ada supplier.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(
                                    (supplier, index) => (
                                        <tr
                                            key={
                                                supplier.supplier_id
                                            }
                                            className="border-t border-slate-100">
                                            <td className="px-5 py-4 text-sm text-slate-500">
                                                {index + 1}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium text-slate-800">
                                                {
                                                    supplier.supplier_name
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {supplier.phone}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {supplier.address}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-center gap-2">
                                                    {/* Edit */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(
                                                                supplier
                                                            )
                                                        }
                                                        className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"
                                                        title="Edit">
                                                        <Pencil
                                                            size={16}/>
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            remove(
                                                                supplier
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100" title="Hapus">
                                                        <Trash2
                                                            size={16}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah / Edit Supplier */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                    <form
                        onSubmit={submit}
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        {/* Judul */}
                        <h2 className="text-xl font-bold text-slate-900">
                            {editing
                                ? "Edit Supplier"
                                : "Tambah Supplier"}
                        </h2>

                        {/* Akun Supplier */}
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-900">Akun Supplier</h3>
                            <p className="mt-1 text-xs text-slate-500">Data ini digunakan untuk akun login supplier.</p>
                            <div className="mt-4 space-y-4">
                                {/* Nama User */}
                                <input
                                    required
                                    placeholder="Nama"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"/>

                                {/* Email */}
                                <input
                                    required
                                    type="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"/>

                                {/* Role */}
                                <select
                                    value="supplier"
                                    disabled
                                    className="w-full cursor-not-allowed appearance-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                    <option value="supplier">
                                        Supplier
                                    </option>
                                </select>

                                {/* Password */}
                                <input
                                    required={!editing}
                                    type="password"
                                    placeholder={
                                        editing
                                            ? "Password baru (opsional)"
                                            : "Password"
                                    }
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"/>

                                {/* Konfirmasi Password */}
                                <input
                                    required={
                                        !editing ||
                                        Boolean(form.password)
                                    }
                                    type="password"
                                    placeholder="Konfirmasi password"
                                    value={
                                        form.password_confirmation
                                    }
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password_confirmation:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"/>
                            </div>
                        </div>

                        <div className="my-6 border-t border-slate-200" />

                        {/* Data Supplier */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Data Supplier</h3>
                            <p className="mt-1 text-xs text-slate-500">Informasi supplier yang akan digunakan dalam transaksi pembelian.</p>
                            <div className="mt-4 space-y-4">
                                {/* Nama Supplier */}
                                <input
                                    required
                                    placeholder="Nama supplier"
                                    value={form.supplier_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            supplier_name:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"/>

                                {/* Telepon */}
                                <input
                                    required
                                    type="text"
                                    placeholder="Nomor telepon"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            phone: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"/>

                                {/* Alamat */}
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Alamat"
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            address:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"/>
                            </div>
                        </div>

                        {/* Button */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
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

export default SupplierPage;
