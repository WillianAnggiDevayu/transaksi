import { baseUnit, itemName, unitName } from "../utils/procurement";
import formatRupiah from "../utils/formatRupiah";

export function ErrorDetails({ error }) {
  if (!error) return null;
  const fields = error?.data?.errors || {};
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
    <p>{typeof error === "string" ? error : error.message || "Permintaan gagal."}</p>
    {Object.entries(fields).map(([field, messages]) => <p key={field}>{field}: {[messages].flat().join(" ")}</p>)}
  </div>;
}
export function PackagingTable({ lines = [], variant = "default" }) {
  const supplier = variant === "supplier";
  return <div className={`overflow-x-auto border border-slate-200 ${supplier ? "rounded-xl" : "rounded-lg"}`}><table className={`w-full min-w-[850px] text-left ${supplier ? "text-[13px]" : "text-sm"}`}>
    <thead className={supplier ? "bg-slate-50/80" : "bg-slate-50"}><tr>{["Barang", "Quantity", "Satuan", "Isi / satuan", "Total dasar", "Harga / satuan", "Diskon", "Subtotal"].map((label, index) => <th className={`${supplier ? "px-4 py-3 text-[11px] tracking-[0.05em] text-slate-500" : "p-3"} ${index >= 5 ? "text-right" : ""}`} key={label}>{label}</th>)}</tr></thead>
    <tbody>{lines.map((line, index) => { const base = unitName(line.base_unit || baseUnit(line.detail_supplier_quotation_purchase_request_detail));
      const cell = supplier ? "px-4 py-3.5 text-slate-600" : "p-3";
      return <tr className={`border-t border-slate-100 ${supplier ? "transition-colors hover:bg-blue-50/30" : ""}`} key={line.detail_supplier_quotation_id || line.detail_purchase_order_id || line.clientId || index}>
        <td className={`${cell} ${supplier ? "font-semibold text-slate-800" : ""}`}>{itemName(line)}</td><td className={cell}>{line.quantity}</td>
        <td className={cell}>{unitName(line.purchase_unit)}</td><td className={cell}>{line.conversion_qty} {base}</td>
        <td className={cell}>{line.base_quantity} {base}</td><td className={`${cell} text-right tabular-nums`}>{formatRupiah(line.unit_price)}</td>
        <td className={`${cell} text-right tabular-nums`}>{line.discount_percentage || 0}%</td><td className={`${cell} text-right font-semibold tabular-nums text-slate-800`}>{formatRupiah(line.subtotal)}</td>
      </tr>; })}</tbody></table></div>;
}
export function QuantitySummary({ summary = [], requests = [], variant = "default" }) {
  const supplier = variant === "supplier";
  return <div className="space-y-2">{summary.map(row => { const pr = requests.find(p => p.detail_purchase_request_id === row.detail_purchase_request_id);
    return <div key={row.detail_purchase_request_id} className={`rounded-lg border p-3 ${supplier ? "flex flex-col gap-1 text-[13px] sm:flex-row sm:items-center sm:justify-between" : "text-sm"} ${Number(row.difference) ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
      <span><b>{pr ? itemName(pr) : row.item_id}</b>{supplier ? <span className="text-slate-600"> · Kebutuhan {row.requested_quantity}, ditawarkan {row.offered_quantity} {unitName(baseUnit(pr))}</span> : <>: kebutuhan {row.requested_quantity}, ditawarkan {row.offered_quantity} {unitName(baseUnit(pr))}</>}</span>
      <span className={`${supplier ? "w-fit rounded-full bg-white/70 px-2.5 py-1 text-xs" : "ml-2"} font-semibold`}>{Number(row.difference) === 0 ? "Sesuai" : Number(row.difference) > 0 ? "Kelebihan " + row.difference : "Kekurangan " + Math.abs(row.difference)}</span>
    </div>; })}</div>;
}
