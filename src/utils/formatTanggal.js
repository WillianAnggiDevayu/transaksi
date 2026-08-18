export default function formatTanggal(tanggal) {
    if (!tanggal) return "-";

    return new Date(tanggal).toLocaleDateString("id-ID", {
        weekday: 'long',
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}