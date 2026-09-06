import { useEffect, useMemo, useState } from "react";

import {
  Eye,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";

import PurchaseRequestService from "../../services/PurchaseRequestService";
import RequestSupplierService from "../../services/RequestSupplierService";
import SupplierQuotationService from "../../services/SupplierQuotationService";
import SupplierService from "../../services/SupplierService";
import ItemService from "../../services/ItemService";
import PurchaseOrderService from "../../services/PurchaseOrderService";
import { PackagingTable, QuantitySummary, ErrorDetails } from "../../components/ProcurementDetails";
import { localDate, poPayload, canEditQuotation } from "../../utils/procurement";

const empty = {
  item_id: "",
  quantity: 1,
  notes: "",
};

const labels = {
  draft: "Draft",
  waiting_supplier: "Menunggu Supplier",
  supplier_responded: "Supplier Merespons",
  quotation_received: "Quotation Diterima",
  po_created: "PO Dibuat",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

function PurchaseRequestPage() {
  const [requests, setRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);

  const [selected, setSelected] = useState(null);
  const [supplierRows, setSupplierRows] = useState([]);

  // Untuk modal quotation
  const [selectedQuotation, setSelectedQuotation] =
    useState(null);

  const [create, setCreate] = useState(false);
  const [send, setSend] = useState(false);

  const [rows, setRows] = useState([
    { ...empty },
  ]);

  const [supplierIds, setSupplierIds] = useState([]);

  const [date, setDate] = useState(
    localDate()
  );

  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [quotationLoadingId, setQuotationLoadingId] = useState(null);
  const [poLoading, setPoLoading] = useState(false);
  const [poForm, setPoForm] = useState({
    order_date: localDate(),
    accept_quantity_difference: false,
    notes: "",
  });
  const [error, setError] = useState("");

  const [masterAccess, setMasterAccess] = useState({ items: false, suppliers: false });
  const [masterError, setMasterError] = useState("");

  // LOAD DATA
  const load = async () => {
    const [r, s, i] = await Promise.allSettled([PurchaseRequestService.getAll(), SupplierService.getAll(), ItemService.getAll()]);
    if (r.status === "fulfilled") setRequests(Array.isArray(r.value) ? r.value : []);
    else setError(r.reason.message || "Gagal mengambil PR.");
    setSuppliers(s.status === "fulfilled" && Array.isArray(s.value) ? s.value : []);
    setItems(i.status === "fulfilled" && Array.isArray(i.value) ? i.value : []);
    setMasterAccess({ items: i.status === "fulfilled", suppliers: s.status === "fulfilled" });
    setMasterError([s.status === "rejected" ? "Daftar supplier tidak dapat diakses. Pengiriman request dinonaktifkan." : "",
      i.status === "rejected" ? "Daftar barang tidak dapat diakses. Pembuatan PR dinonaktifkan." : ""].filter(Boolean).join(" "));
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(load, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  // SEARCH
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return requests.filter((x) =>
      `${x.nomor || x.request_number || ""} ${
        x.status || ""
      }`
        .toLowerCase()
        .includes(q)
    );
  }, [requests, search]);

  // CARI ITEM
  const getItemById = (itemId) => {
    return items.find(
      (item) =>
        String(
          item.item_id ?? item.id
        ) === String(itemId)
    );
  };

  // =========================================================
  // NAMA ITEM
  // =========================================================

  const getItemName = (itemId) => {
    const item = getItemById(itemId);

    return (
      item?.item_name ||
      item?.nama ||
      item?.nama_barang ||
      "-"
    );
  };

  // =========================================================
  // SATUAN ITEM
  // =========================================================

  const getItemUnit = (itemId) => {
    const item = getItemById(itemId);

    if (!item) {
      return "-";
    }

    return (
      item?.item_unit?.unit_name ||
      item?.itemUnit?.unit_name ||
      item?.unit_name ||
      "-"
    );
  };

  // =========================================================
  // FORMAT RUPIAH
  // =========================================================

  const formatRupiah = (value) => {
    const number = Number(value || 0);

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // =========================================================
  // FORMAT TANGGAL
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // =========================================================
  // AMBIL DETAIL QUOTATION
  // =========================================================

  const getQuotationDetails = (quotation) => {
    if (!quotation) {
      return [];
    }

    return (
      quotation
        .supplier_quotation_detail_supplier_quotation ||
      quotation.supplierQuotationDetailSupplierQuotation ||
      quotation.details ||
      []
    );
  };

  const getItemDiscountSummary = (quotation) => {
    const details = getQuotationDetails(quotation);
    const percentages = [...new Set(
      details
        .map((detail) => Number(detail.discount_percentage || 0))
        .filter((value) => value > 0)
    )];

    return {
      amount: details.reduce(
        (total, detail) => total + Number(detail.discount_amount || 0),
        0
      ),
      label: percentages.length === 1 ? ` (${percentages[0]}%)` : "",
    };
  };

  // Data quotation pada daftar supplier hanya berisi header. Ambil ulang
  // detail Request Supplier agar relasi item quotation ikut dimuat.
  const openQuotation = async (requestSupplier) => {
    const requestSupplierId = requestSupplier.request_supplier_id;

    setQuotationLoadingId(requestSupplierId);
    setError("");

    try {
      const result =
        await SupplierQuotationService.getRequestDetail(requestSupplierId);

      const quotation =
        result?.request_supplier_supplier_quotation ||
        result?.requestSupplierSupplierQuotation ||
        result?.supplier_quotation ||
        null;

      if (!quotation) {
        throw new Error("Data penawaran tidak ditemukan.");
      }

      setSelectedQuotation(quotation);
      setPoForm({
        order_date: localDate(),
        accept_quantity_difference: false,
        notes: "",
      });
    } catch (e) {
      setError(
        e?.data?.message ||
          e?.message ||
          "Gagal mengambil detail penawaran."
      );
    } finally {
      setQuotationLoadingId(null);
    }
  };

  const selectedSummary = selectedQuotation?.quantity_summary || [];
  const hasDifference = selectedSummary.some(row => Number(row.difference) !== 0);

  const createPurchaseOrder = async (event) => {
    event.preventDefault();
    setPoLoading(true);
    setError("");

    try {
      const response = await SupplierQuotationService.getRequestDetail(selectedQuotation.request_supplier_id);
      const latest = response.request_supplier_supplier_quotation;
      if (!latest || latest.status !== "submitted") throw new Error("Penawaran sudah tidak dapat dipilih. Muat ulang detail penawaran.");
      if (JSON.stringify(latest.quantity_summary) !== JSON.stringify(selectedQuotation.quantity_summary) || String(latest.total) !== String(selectedQuotation.total)) {
        setSelectedQuotation(latest);
        setPoForm(previous => ({ ...previous, accept_quantity_difference: false }));
        throw new Error("Penawaran telah berubah. Periksa ulang jumlah dan harga sebelum membuat PO.");
      }
      await PurchaseOrderService.createFromQuotation(
        selectedQuotation.supplier_quotation_id,
        poPayload(poForm, selectedSummary)
      );
      setSelectedQuotation(null);
      await detail(selected);
      await load();
    } catch (e) {
      setError(
        e?.data?.message || e?.message || "Gagal membuat Purchase Order."
      );
    } finally {
      setPoLoading(false);
    }
  };

  // =========================================================
  // BUKA DETAIL PURCHASE REQUEST
  // =========================================================

  const detail = async (r) => {
    try {
      const requestId =
        r.id ||
        r.purchase_request_id;

      const d =
        await PurchaseRequestService.getById(
          requestId
        );

      setSelected(
        d?.data || d
      );

      const s =
        await RequestSupplierService.getByPurchaseRequest(
          requestId
        );

      setSupplierRows(
        Array.isArray(s) ? s : []
      );

      setSelectedQuotation(null);
      setError("");
    } catch (e) {
      setError(
        e?.data?.message ||
          e?.message ||
          "Gagal mengambil detail."
      );
    }
  };

  // =========================================================
  // SUBMIT PURCHASE REQUEST
  // =========================================================

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (
        rows.some(
          (x) =>
            !x.item_id ||
            Number(x.quantity) < 1
        )
      ) {
        throw new Error(
          "Detail barang belum lengkap."
        );
      }

      await PurchaseRequestService.create({
        request_date: date,

        notes:
          notes || null,

        details: rows.map((x) => ({
          item_id: x.item_id,
          quantity:
            Number(x.quantity),
          notes:
            x.notes || null,
        })),
      });

      setCreate(false);

      setRows([
        { ...empty },
      ]);

      setNotes("");

      await load();
    } catch (e) {
      setError(
        e?.data?.message ||
          e?.message ||
          "Gagal membuat Purchase Request."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // KIRIM PURCHASE REQUEST KE SUPPLIER
  // =========================================================

  const sendRequest = async (e) => {
    e.preventDefault();

    if (
      !selected ||
      !supplierIds.length
    ) {
      setError(
        "Pilih minimal satu supplier."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      await RequestSupplierService.createMultiple(
        selected.purchase_request_id ||
          selected.id,
        {
          supplier_ids:
            supplierIds,
        }
      );

      setSend(false);
      setSupplierIds([]);

      await detail(selected);
      await load();
    } catch (e) {
      setError(
        e?.data?.message ||
          e?.message ||
          "Gagal mengirim request."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HALAMAN DETAIL
  // =========================================================

  if (selected) {
    return (
      <section className="space-y-5">

        {/* HEADER DETAIL */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Purchase Request
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {selected.request_number}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setSelectedQuotation(null);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Kembali
          </button>
        </div>

        {masterError && <div role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{masterError}</div>}
      {/* ERROR */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* INFORMASI PR */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            <div>
              <p className="text-xs text-slate-500">
                Tanggal
              </p>

              <p className="mt-1 text-sm">
                {selected.request_date}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Status
              </p>

              <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {labels[selected.status] ||
                  selected.status}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Catatan
              </p>

              <p className="mt-1 text-sm">
                {selected.notes || "-"}
              </p>
            </div>

          </div>
        </div>

        {/* DETAIL BARANG */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Detail Barang
            </h2>

            {selected.status ===
              "draft" && (
              <button
                type="button"
                disabled={!masterAccess.suppliers}
                title={masterError}
                onClick={() =>
                  (masterAccess.suppliers ? setSend(true) : setError(masterError))
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Send size={14} />
                Kirim ke Supplier
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    No
                  </th>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Barang
                  </th>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Qty
                  </th>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Satuan
                  </th>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Catatan
                  </th>
                </tr>
              </thead>

              <tbody>
                {(
                  selected.purchase_request_detail_purchase_request ||
                  selected.detail_purchase_requests ||
                  []
                ).map((d, i) => {

                  const item =
                    d.item ||
                    d.detail_purchase_request_item;

                  const unit =
                    d.base_unit?.unit_name ||
                    item?.item_unit?.unit_name ||
                    item?.itemUnit?.unit_name ||
                    item?.unit_name ||
                    "-";

                  return (
                    <tr
                      key={
                        d.detail_purchase_request_id ||
                        i
                      }
                      className="border-t border-slate-100"
                    >

                      <td className="p-3 text-sm text-slate-500">
                        {i + 1}
                      </td>

                      <td className="p-3 text-sm font-medium text-slate-800">
                        {item?.item_name ||
                          getItemName(
                            d.item_id
                          )}
                      </td>

                      <td className="p-3 text-sm text-slate-700">
                        {d.quantity}
                      </td>

                      <td className="p-3 text-sm font-medium text-slate-600">
                        {unit}
                      </td>

                      <td className="p-3 text-sm text-slate-600">
                        {d.notes || "-"}
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </div>

        {/* SUPPLIER */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-sm font-semibold">
            Supplier
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">

              <thead className="bg-slate-50">
                <tr>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Supplier
                  </th>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Respons
                  </th>

                  <th className="p-3 text-xs font-semibold uppercase text-slate-500">
                    Quotation / Penawaran
                  </th>

                </tr>
              </thead>

              <tbody>

                {supplierRows.map((r) => {

                  const quotation =
                    r.request_supplier_supplier_quotation ||
                    r.requestSupplierSupplierQuotation ||
                    null;

                  return (
                    <tr
                      key={
                        r.request_supplier_id
                      }
                      className="border-t border-slate-100"
                    >

                      {/* SUPPLIER */}
                      <td className="p-3 text-sm">
                        {r
                          .request_supplier_supplier
                          ?.supplier_name ||
                          r.supplier
                            ?.supplier_name ||
                          "-"}
                      </td>

                      {/* STATUS */}
                      <td className="p-3 text-sm">
                        {r.status}
                      </td>

                      {/* RESPON */}
                      <td className="p-3 text-sm">
                        {r.responded_at ||
                          "-"}
                      </td>

                      {/* QUOTATION */}
                      <td className="p-3 text-sm">

                        {quotation ? (
                          <div className="flex items-center gap-3">

                            <span className="text-sm font-medium text-slate-700">
                              {quotation.quotation_number ||
                                "-"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                openQuotation(r)
                              }
                              disabled={
                                quotationLoadingId ===
                                r.request_supplier_id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                            >
                              <Eye size={14} />
                              {quotationLoadingId ===
                              r.request_supplier_id
                                ? "Memuat..."
                                : "Lihat Penawaran"}
                            </button>

                          </div>
                        ) : (
                          "-"
                        )}

                      </td>

                    </tr>
                  );
                })}

                {!supplierRows.length && (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-8 text-center text-sm text-slate-400"
                    >
                      Belum ada supplier.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          </div>
        </div>

        {/* =====================================================
            MODAL LIHAT PENAWARAN
        ===================================================== */}

        {selectedQuotation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-xl">

              {/* HEADER MODAL */}
              <div className="flex items-center justify-between border-b border-slate-200 p-6">

                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Supplier Quotation
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Detail Penawaran
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuotation(null)
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>

              </div>

              {/* INFORMASI QUOTATION */}
              <div className="p-6">

                <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

                  <div>
                    <p className="text-xs text-slate-500">
                      Nomor Quotation
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedQuotation.quotation_number ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Tanggal Penawaran
                    </p>

                    <p className="mt-1 text-sm text-slate-800">
                      {formatDate(
                        selectedQuotation.quotation_date
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Berlaku Sampai
                    </p>

                    <p className="mt-1 text-sm text-slate-800">
                      {formatDate(
                        selectedQuotation.valid_until
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Status
                    </p>

                    <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {selectedQuotation.status ||
                        "-"}
                    </span>
                  </div>

                </div>

                {/* DETAIL BARANG QUOTATION */}
                <div className="mt-6">

                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Detail Penawaran
                  </h3>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">

                    <PackagingTable lines={getQuotationDetails(selectedQuotation)} />
                    <div className="mt-4"><QuantitySummary summary={selectedSummary} requests={selected?.purchase_request_detail_purchase_request || selected?.details || []} /></div>

                  </div>
                </div>

                {/* TOTAL QUOTATION */}
                <div className="mt-6 flex justify-end">

                  <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50/60 p-4">

                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="text-slate-500">
                        Diskon Item
                        {getItemDiscountSummary(selectedQuotation).label}
                      </span>

                      <span className="font-medium tabular-nums text-red-600">
                        - {formatRupiah(
                          getItemDiscountSummary(selectedQuotation).amount
                        )}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-4 text-xs">
                      <span className="text-slate-500">
                        Subtotal
                      </span>

                      <span className="font-medium tabular-nums text-slate-700">
                        {formatRupiah(
                          selectedQuotation.subtotal
                        )}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-4 text-xs">
                      <span className="text-slate-500">
                        Diskon Tambahan
                        {" "}
                        (
                        {Number(
                          selectedQuotation.discount_total_percentage ||
                            0
                        )}
                        %)
                      </span>

                      <span className="font-medium tabular-nums text-slate-700">
                        - {formatRupiah(
                          selectedQuotation.discount_amount
                        )}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-slate-200 pt-3">

                      <div className="flex items-center justify-between gap-4 text-sm">

                        <span className="font-semibold text-slate-800">
                          Total
                        </span>

                        <span className="font-semibold tabular-nums text-blue-600">
                          {formatRupiah(
                            selectedQuotation.total
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* CATATAN */}
                <div className="mt-6">

                  <p className="text-xs text-slate-500">
                    Catatan Penawaran
                  </p>

                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {selectedQuotation.notes ||
                      "-"}
                  </div>

                </div>

                {selectedQuotation.status === "submitted" && canEditQuotation(selectedQuotation) && (
                  <form
                    onSubmit={createPurchaseOrder}
                    className="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Buat Purchase Order
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Buat PO langsung dari penawaran supplier ini.
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-xs font-medium text-slate-600">Tanggal Order</span>
                        <input required type="date" value={poForm.order_date} onChange={(event) => setPoForm({ ...poForm, order_date: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-medium text-slate-600">Catatan PO</span>
                        <textarea value={poForm.notes} onChange={(event) => setPoForm({ ...poForm, notes: event.target.value })} className="min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Catatan opsional" />
                      </label>
                    </div>

                    <ErrorDetails error={error} />
                    {hasDifference && <label className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                      <input type="checkbox" checked={poForm.accept_quantity_difference} onChange={e => setPoForm({ ...poForm, accept_quantity_difference: e.target.checked })} />
                      Saya sudah memeriksa dan menyetujui kelebihan/kekurangan quantity pada penawaran ini.
                    </label>}
                    <div className="mt-4 flex justify-end">
                      <button disabled={poLoading || (hasDifference && !poForm.accept_quantity_difference)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                        {poLoading ? "Membuat PO..." : "Buat Purchase Order"}
                      </button>
                    </div>
                  </form>
                )}

              </div>

              {/* FOOTER */}
              <div className="flex justify-end border-t border-slate-200 p-6">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuotation(null)
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Tutup
                </button>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            MODAL KIRIM SUPPLIER
        ===================================================== */}

        {send && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <form
              onSubmit={sendRequest}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            >

              <h2 className="text-lg font-bold text-slate-900">
                Kirim Request Supplier
              </h2>

              <div className="mt-4 max-h-64 space-y-2 overflow-auto">

                {suppliers.map((s) => {

                  const supplierId =
                    s.supplier_id ||
                    s.id;

                  const supplierName =
                    s.supplier_name ||
                    s.nama ||
                    "-";

                  return (
                    <label
                      key={supplierId}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                    >

                      <input
                        type="checkbox"
                        checked={supplierIds.includes(
                          supplierId
                        )}
                        onChange={() =>
                          setSupplierIds(
                            (current) =>
                              current.includes(
                                supplierId
                              )
                                ? current.filter(
                                    (id) =>
                                      id !==
                                      supplierId
                                  )
                                : [
                                    ...current,
                                    supplierId,
                                  ]
                          )
                        }
                      />

                      <span className="text-sm text-slate-700">
                        {supplierName}
                      </span>

                    </label>
                  );
                })}

              </div>

              <div className="mt-5 flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setSend(false)
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  disabled={loading}
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading
                    ? "Mengirim..."
                    : "Kirim"}
                </button>

              </div>

            </form>

          </div>
        )}

      </section>
    );
  }

  // =========================================================
  // HALAMAN UTAMA
  // =========================================================

  return (
    <section>

      {/* HEADER */}
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>

          <p className="text-sm font-medium text-blue-600">
            Procurement
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Purchase Request
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola kebutuhan pembelian dan pengiriman request ke supplier.
          </p>

        </div>

        <button
          type="button"
          disabled={!masterAccess.items}
          title={masterError}
          onClick={() =>
            (masterAccess.items ? setCreate(true) : setError(masterError))
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Buat Purchase Request
        </button>

      </div>

      {masterError && <div role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{masterError}</div>}
      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TABLE PURCHASE REQUEST */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 p-4">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Cari nomor atau status..."
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px] text-left">

            <thead className="bg-slate-50">

              <tr>

                <th className="p-4 text-xs font-semibold uppercase text-slate-500">
                  No
                </th>

                <th className="p-4 text-xs font-semibold uppercase text-slate-500">
                  No. PR
                </th>

                <th className="p-4 text-xs font-semibold uppercase text-slate-500">
                  Tanggal
                </th>

                <th className="p-4 text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>

                <th className="p-4 text-center text-xs font-semibold uppercase text-slate-500">
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.map((r, i) => (

                <tr
                  key={
                    r.id ||
                    r.purchase_request_id
                  }
                  className="border-t border-slate-100"
                >

                  <td className="p-4 text-sm text-slate-500">
                    {i + 1}
                  </td>

                  <td className="p-4 text-sm font-semibold text-slate-800">
                    {r.nomor ||
                      r.request_number}
                  </td>

                  <td className="p-4 text-sm text-slate-600">
                    {r.tanggal ||
                      r.request_date}
                  </td>

                  <td className="p-4 text-sm">

                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {labels[
                        r.status
                      ] ||
                        r.status}
                    </span>

                  </td>

                  <td className="p-4 text-center">

                    <button
                      type="button"
                      onClick={() =>
                        detail(r)
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      <Eye size={14} />
                      Detail
                    </button>

                  </td>

                </tr>

              ))}

              {!filtered.length && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center text-sm text-slate-400"
                  >
                    Belum ada purchase request.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          MODAL BUAT PURCHASE REQUEST
      ===================================================== */}

      {create && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <form
            onSubmit={submit}
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-xl"
          >

            <h2 className="text-lg font-bold text-slate-900">
              Buat Purchase Request
            </h2>

            {/* TANGGAL + CATATAN */}
            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <input
                required
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                placeholder="Catatan"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

            </div>

            {/* DETAIL BARANG */}
            <div className="mt-5 space-y-3">

              {rows.map((r, i) => {

                const unit =
                  getItemUnit(
                    r.item_id
                  );

                return (
                  <div
                    key={i}
                    className="grid gap-3 rounded-lg border border-slate-300 p-3 md:grid-cols-[1fr_150px_1fr_auto]"
                  >

                    {/* PILIH BARANG */}
                    <select
                      required
                      value={r.item_id}
                      onChange={(e) =>
                        setRows(
                          (current) =>
                            current.map(
                              (row, index) =>
                                index === i
                                  ? {
                                      ...row,
                                      item_id:
                                        e.target.value,
                                    }
                                  : row
                            )
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    >

                      <option value="">
                        Pilih barang
                      </option>

                      {items.map(
                        (item) => {

                          const itemId =
                            item.item_id ??
                            item.id;

                          const itemName =
                            item.item_name ||
                            item.nama ||
                            item.nama_barang ||
                            "-";

                          return (
                            <option
                              key={itemId}
                              value={itemId}
                            >
                              {itemName}
                            </option>
                          );
                        }
                      )}

                    </select>

                    {/* JUMLAH + SATUAN */}
                    <div className="flex gap-2">

                      <input
                        required
                        min="1"
                        type="number"
                        value={
                          r.quantity
                        }
                        onChange={(e) =>
                          setRows(
                            (current) =>
                              current.map(
                                (row, index) =>
                                  index === i
                                    ? {
                                        ...row,
                                        quantity:
                                          e.target.value,
                                      }
                                    : row
                              )
                          )
                        }
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />

                      <div
                        className="flex min-w-[65px] items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-600"
                        title="Satuan barang"
                      >
                        {unit}
                      </div>

                    </div>

                    {/* CATATAN ITEM */}
                    <input
                      value={r.notes}
                      onChange={(e) =>
                        setRows(
                          (current) =>
                            current.map(
                              (row, index) =>
                                index === i
                                  ? {
                                      ...row,
                                      notes:
                                        e.target.value,
                                    }
                                  : row
                            )
                        )
                      }
                      placeholder="Catatan item"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />

                    {/* HAPUS */}
                    <button
                      type="button"
                      onClick={() => {

                        if (
                          rows.length >
                          1
                        ) {
                          setRows(
                            (current) =>
                              current.filter(
                                (_, index) =>
                                  index !== i
                              )
                          );
                        }

                      }}
                      disabled={
                        rows.length === 1
                      }
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>

                  </div>
                );
              })}

            </div>

            {/* TAMBAH BARIS */}
            <button
              type="button"
              onClick={() =>
                setRows(
                  (current) => [
                    ...current,
                    { ...empty },
                  ]
                )
              }
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + Tambah baris
            </button>

            {/* BUTTON */}
            <div className="mt-6 flex justify-end gap-2">

              <button
                type="button"
                onClick={() => {

                  setCreate(false);

                  setRows([
                    { ...empty },
                  ]);

                  setNotes("");

                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                disabled={loading}
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Menyimpan..."
                  : "Simpan PR"}
              </button>

            </div>

          </form>

        </div>
      )}

    </section>
  );
}

export default PurchaseRequestPage;
