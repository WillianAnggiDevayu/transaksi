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
export function PackagingTable({ lines = [] }) {
  return <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[850px] text-left text-sm">
    <thead className="bg-slate-50"><tr>{["Barang", "Quantity", "Satuan", "Isi / satuan", "Total dasar", "Harga / satuan", "Diskon", "Subtotal"].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
    <tbody>{lines.map((line, index) => { const base = unitName(line.base_unit || baseUnit(line.detail_supplier_quotation_purchase_request_detail));
      return <tr className="border-t border-slate-100" key={line.detail_supplier_quotation_id || line.detail_purchase_order_id || line.clientId || index}>
        <td className="p-3">{itemName(line)}</td><td className="p-3">{line.quantity}</td>
        <td className="p-3">{unitName(line.purchase_unit)}</td><td className="p-3">{line.conversion_qty} {base}</td>
        <td className="p-3">{line.base_quantity} {base}</td><td className="p-3">{formatRupiah(line.unit_price)}</td>
        <td className="p-3">{line.discount_percentage || 0}%</td><td className="p-3">{formatRupiah(line.subtotal)}</td>
      </tr>; })}</tbody></table></div>;
}
export function QuantitySummary({ summary = [], requests = [] }) {
  return <div className="space-y-2">{summary.map(row => { const pr = requests.find(p => p.detail_purchase_request_id === row.detail_purchase_request_id);
    return <div key={row.detail_purchase_request_id} className={"rounded-lg border p-3 text-sm " + (Number(row.difference) ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
      <b>{pr ? itemName(pr) : row.item_id}</b>: kebutuhan {row.requested_quantity}, ditawarkan {row.offered_quantity} {unitName(baseUnit(pr))}
      <span className="ml-2 font-semibold">{Number(row.difference) === 0 ? "Sesuai" : Number(row.difference) > 0 ? "Kelebihan " + row.difference : "Kekurangan " + Math.abs(row.difference)}</span>
    </div>; })}</div>;
}
