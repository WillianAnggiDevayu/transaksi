import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from "@headlessui/react";

function BarangFormModal({
    show,
    editingItem,
    form,
    loading,
    error,
    onClose,
    onChange,
    onSubmit,
}) {
    return (
        <Dialog open={show} onClose={() => !loading && onClose()} className="relative z-[9999]">
            <DialogBackdrop transition className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in" />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 sm:p-6">

                    <DialogPanel transition className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white text-left shadow-xl outline -outline-offset-1 outline-black/10">

                        {/* HEADER */}
                        <div className="px-6 pt-6 pb-5">
                            <div className="flex items-start justify-between gap-4">

                                <div>
                                    <DialogTitle as="h2" className="text-xl font-semibold leading-6 text-gray-900">
                                        {editingItem ? "Edit Barang" : "Tambah Barang"}
                                    </DialogTitle>

                                    <p className="mt-1.5 text-sm leading-5 text-gray-500">
                                        {editingItem ? "Perbarui informasi barang." : "Masukkan informasi barang baru."}
                                    </p>
                                </div>

                                <button type="button" onClick={onClose} disabled={loading} className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50">
                                    <span className="text-xl leading-none">×</span>
                                </button>

                            </div>
                        </div>

                        {/* FORM */}
                        <form onSubmit={onSubmit}>

                            <div className="space-y-5 px-6 pb-6">

                                {/* ERROR */}
                                {error && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                {/* NAMA BARANG */}
                                <div>
                                    <label htmlFor="item_name" className="mb-2 block text-sm font-medium leading-5 text-gray-700">
                                        Nama Barang
                                    </label>

                                    <input id="item_name" name="item_name" type="text" value={form.item_name} onChange={onChange} disabled={loading} autoFocus placeholder="Masukkan nama barang" className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500" />
                                </div>

                                {/* STOK */}
                                <div>
                                    <label htmlFor="stock" className="mb-2 block text-sm font-medium leading-5 text-gray-700">
                                        Stok
                                    </label>

                                    <input id="stock" name="stock" type="number" min="0" value={form.stock} onChange={onChange} disabled={loading} className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500" />
                                </div>

                                {/* HARGA */}
                                <div>
                                    <label htmlFor="item_price" className="mb-2 block text-sm font-medium leading-5 text-gray-700">
                                        Harga
                                    </label>

                                    <input id="item_price" name="item_price" type="number" min="0" value={form.item_price} onChange={onChange} disabled={loading} className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500" />
                                </div>

                            </div>

                            {/* FOOTER */}
                            <div className="flex flex-row-reverse items-center gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

                                <button type="submit" disabled={loading} className="inline-flex w-auto items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    {loading ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Tambah Barang"}
                                </button>

                                <button type="button" onClick={onClose} disabled={loading} className="inline-flex w-auto items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                                    Batal
                                </button>

                            </div>

                        </form>

                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}

export default BarangFormModal;