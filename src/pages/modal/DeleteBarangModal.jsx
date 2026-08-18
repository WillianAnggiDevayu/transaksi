function DeleteBarangModal({
    show,
    item,
    loading,
    error,
    onClose,
    onConfirm,
}) {
    if (!show || !item) return null;

    return (
        <div
            className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/50
        p-4
      "
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) {
                    onClose();
                }
            }}
        >
            <div
                className="
          w-full max-w-md
          overflow-hidden
          rounded-xl
          bg-white
          shadow-2xl
        "
            >

                <div className="px-6 py-5">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Hapus Barang
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>

                <div className="px-6 pb-6">

                    {error && (
                        <div
                            className="
                mb-4
                rounded-lg
                border border-red-200
                bg-red-50
                px-4 py-3
                text-sm text-red-700
              "
                        >
                            {error}
                        </div>
                    )}

                    <div
                        className="
              rounded-lg
              border border-gray-200
              bg-gray-50
              p-4
            "
                    >
                        <p className="font-semibold text-gray-900">
                            {item.nama}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Stok: {item.stok ?? 0}
                        </p>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-600">
                        Apakah kamu yakin ingin menghapus barang ini?
                        Data barang yang sudah dihapus tidak dapat
                        dikembalikan.
                    </p>
                </div>

                <div
                    className="
            flex
            justify-end
            gap-2
            border-t border-gray-200
            px-6 py-4
          "
                >

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="
              rounded-lg
              px-4 py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-100
              disabled:opacity-50
            "
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="
              rounded-lg
              bg-gradient-to-r
              from-red-600
              to-red-500
              px-4 py-2.5
              text-sm
              font-medium
              text-white
              shadow-md
              shadow-red-500/20
              transition
              hover:from-red-700
              hover:to-red-600
              active:scale-[0.98]
              disabled:opacity-50
            "
                    >
                        {loading ? "Menghapus..." : "Hapus Barang"}
                    </button>

                </div>

            </div>
        </div>
    );
}

export default DeleteBarangModal;