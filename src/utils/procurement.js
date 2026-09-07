export function localDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
export const dateOnly = value => value ? String(value).slice(0, 10) : "";
export const baseUnit = row => row?.base_unit || row?.detail_purchase_request_item?.item_unit || row?.item?.item_unit || {};
export const itemName = row => row?.detail_purchase_order_item?.item_name || row?.detail_purchase_request_item?.item_name || row?.detail_supplier_quotation_purchase_request_detail?.detail_purchase_request_item?.item_name || row?.item?.item_name || row?.item_id || "-";
export const unitName = unit => unit?.unit_name || unit?.unit_code || "-";
export function isOwner(po, user) {
  return user?.role === "supplier" && Boolean(user.id) && po?.purchase_order_supplier?.user_id === user.id;
}
export function canEditQuotation(q, today = localDate()) {
  return Boolean(q) && ["draft", "submitted"].includes(q.status) && (!q.valid_until || dateOnly(q.valid_until) >= today);
}
export function newLine(pr) {
  return { clientId: crypto.randomUUID(), detail_purchase_request_id: pr.detail_purchase_request_id,
    unit_id: "", quantity: 0, conversion_qty: 0, unit_price: 0, discount_percentage: 0 };
}
export function linePayload(line) {
  return { detail_purchase_request_id: line.detail_purchase_request_id, unit_id: line.unit_id,
    quantity: Number(line.quantity), conversion_qty: Number(line.conversion_qty),
    unit_price: Number(line.unit_price), discount_percentage: Number(line.discount_percentage || 0) };
}
export function validateLine(line, pr) {
  const errors = {};
  if (!line.unit_id) errors.unit_id = "Pilih satuan penawaran.";
  for (const field of ["quantity", "conversion_qty"]) {
    const n = Number(line[field]);
    if (!Number.isInteger(n) || n <= 0 || n > 2147483647) errors[field] = "Isi bilangan bulat positif, maksimal 2147483647.";
  }
  if (Number(line.quantity) * Number(line.conversion_qty) > 2147483647) errors.quantity = "Jumlah satuan dasar melebihi kapasitas.";
  if (line.unit_id === (pr?.base_unit_id || baseUnit(pr).unit_id) && Number(line.conversion_qty) !== 1) errors.conversion_qty = "Konversi satuan dasar harus 1.";
  if (line.unit_price === "" || !Number.isFinite(Number(line.unit_price)) || Number(line.unit_price) < 0 || Number(line.unit_price) > 9999999999999.99) errors.unit_price = "Isi harga yang valid.";
  if (!Number.isFinite(Number(line.discount_percentage)) || Number(line.discount_percentage) < 0 || Number(line.discount_percentage) > 100) errors.discount_percentage = "Diskon antara 0 dan 100.";
  return errors;
}
export function previewLine(line) {
  const gross = Math.round(Number(line.quantity || 0) * Number(line.unit_price || 0) * 100) / 100;
  const discount = Math.round(gross * Number(line.discount_percentage || 0)) / 100;
  return { base_quantity: Number(line.quantity || 0) * Number(line.conversion_qty || 0), subtotal: Math.round((gross - discount) * 100) / 100 };
}
export function quantitySummary(requests, lines) {
  return requests.map(pr => {
    const offered = lines.filter(l => l.detail_purchase_request_id === pr.detail_purchase_request_id)
      .reduce((sum, l) => sum + (l.base_quantity == null ? previewLine(l).base_quantity : Number(l.base_quantity)), 0);
    const difference = offered - Number(pr.quantity);
    return { detail_purchase_request_id: pr.detail_purchase_request_id, item_id: pr.item_id,
      requested_quantity: Number(pr.quantity), offered_quantity: offered, difference,
      status: difference === 0 ? "exact" : difference > 0 ? "over" : "under" };
  });
}
export function poPayload(form, summary) {
  const differs = summary.some(row => Number(row.difference) !== 0);
  if (differs && !form.accept_quantity_difference) throw new Error("Konfirmasi selisih quantity sebelum membuat PO.");
  return { order_date: form.order_date, notes: form.notes?.trim() || null,
    ...(differs ? { accept_quantity_difference: true } : {}) };
}
export function shippingPayload(po, dates, estimateOnly = false, today = localDate()) {
  const shipping = estimateOnly ? dateOnly(po.shipping_date) : dates.shipping_date;
  const estimate = dates.expected_delivery_date;
  const valid = d => /^\d{4}-\d{2}-\d{2}$/.test(d || "") && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  if (!valid(shipping) || (!estimateOnly && (shipping !== today || shipping < dateOnly(po.order_date)))) throw new Error("Tanggal pengiriman aktual harus hari ini dan tidak boleh sebelum tanggal PO.");
  if (!valid(estimate) || estimate < shipping) throw new Error("Estimasi tiba harus sama dengan atau setelah tanggal kirim.");
  return estimateOnly ? { expected_delivery_date: estimate } : { status: "shipping", shipping_date: shipping, expected_delivery_date: estimate };
}
export function requiresOnline(path, method = "POST") {
  return !["GET", "HEAD"].includes(method.toUpperCase()) && /^\/(supplier-quotations|purchase-orders|payments)(\/|$)/.test(path);
}
export function paymentPayload(form) {
  return { amount: Number(form.amount), payment_method: form.paymentMethod, payment_date: form.paymentDate || null, notes: form.notes?.trim() || null };
}
