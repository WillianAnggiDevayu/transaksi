export function amountCents(value) {
  const text = String(value);
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function amountError(value, summary) {
  if (!summary) return "Ringkasan pembayaran belum tersedia.";
  const cents = amountCents(value);
  if (cents === null) return "Masukkan nominal dengan maksimal dua angka desimal.";
  if (cents <= 0) return "Nominal pembayaran harus lebih dari 0.";
  const remaining = amountCents(summary.remaining_amount);
  if (remaining === null || cents > remaining) return "Nominal pembayaran melebihi sisa tagihan PO.";
  return "";
}
