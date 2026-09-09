import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
vi.mock("../src/hooks/useCachedList", () => ({ default: vi.fn() }));
import useCachedList from "../src/hooks/useCachedList";
import ItemPage from "../src/pages/admin/ItemPage";
import UnitPage from "../src/pages/admin/UnitPage";
import SupplierPage from "../src/pages/admin/SupplierPage";
import UserPage from "../src/pages/admin/UserPage";
import PurchaseRequestPage from "../src/pages/admin-akuntan/PurchaseRequestPage";
import PurchaseOrderPage from "../src/pages/admin-akuntan/PurchaseOrderPage";
import PaymentPage from "../src/pages/admin-akuntan/PaymentPage";
import RequestOrder from "../src/pages/supplier/RequestOrder";
import SupplierPurchaseOrder from "../src/pages/supplier/SupplierPurchaseOrder";
import SupplierPayments from "../src/pages/supplier/SupplierPayments";
import { PackagingTable } from "../src/components/ProcurementDetails";

const makeRows = (fn) => Array.from({ length: 23 }, (_, i) => fn(i + 1));
const orders = makeRows(i => ({ purchase_order_id: `po${i}`, po_number: `PO-${i}`, status: "draft", total: 10000 }));
const payments = makeRows(i => ({ payment_id: `pay${i}`, payment_number: `PAY-${i}`, purchase_order_id: "po1", amount: 100, status: "draft" }));
let cache;
const empty = [];
beforeEach(() => {
  cache = {
    items: makeRows(i => ({ item_id: i, item_name: `Barang-${i}`, stock: 5 })),
    units: makeRows(i => ({ unit_id: i, unit_name: `Unit-${i}`, unit_code: `U${i}` })),
    suppliers: makeRows(i => ({ supplier_id: i, supplier_name: `Supplier-${i}` })),
    users: makeRows(i => ({ id: i, name: `User-${i}`, role: "akuntan", email: `user${i}@example.test` })),
    "purchase-requests": makeRows(i => ({ purchase_request_id: i, request_number: `PR-${i}`, status: "draft" })),
    "purchase-orders": orders,
    "supplier-quotations": makeRows(i => ({ request_supplier_id: i, status: "pending", request_supplier_purchase_request: { request_number: `REQ-${i}` } })),
    overview: [{ purchase_order_id: "po1", payments, summary: { total_amount: 10000, confirmed_amount: 0, remaining_amount: 10000 } }],
  };
  useCachedList.mockImplementation((key, service, method, options = {}) => ({
    data: key.startsWith("payment-overview:") ? cache.overview : cache[key] ?? (options.resultType === "object" ? null : empty),
    loading: false, refreshing: false, stale: false, error: null, refresh: async () => {},
  }));
});
afterEach(cleanup);

const pages = [
  ["barang admin", <ItemPage />, "Barang"],
  ["unit admin", <UnitPage />, "Unit"],
  ["supplier admin", <SupplierPage />, "Supplier"],
  ["pengguna admin", <UserPage />, "User"],
  ["PR admin/akuntan", <PurchaseRequestPage />, "PR"],
  ["PO admin/akuntan", <PurchaseOrderPage />, "PO"],
  ["pembayaran admin/akuntan", <PaymentPage />, "PAY"],
  ["penawaran supplier", <RequestOrder />, "REQ"],
  ["PO supplier", <SupplierPurchaseOrder />, "PO"],
  ["pembayaran supplier", <SupplierPayments purchaseOrder={orders[0]} />, "PAY"],
];

it.each(pages)("paginates %s with ten rows and continuous numbering", (name, element, prefix) => {
  render(element);
  const table = screen.getByRole("table");
  expect(within(table).getAllByRole("row")).toHaveLength(11);
  expect(screen.queryByText(`${prefix}-11`)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  expect(screen.getByText(`${prefix}-11`)).toBeTruthy();
  expect(screen.queryByText(`${prefix}-1`)).toBeNull();
  expect(within(table).getAllByRole("row")).toHaveLength(11);
  if (prefix !== "REQ") expect(within(table).getAllByRole("row")[1].firstElementChild.textContent).toBe("11");
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  expect(within(table).getAllByRole("row")).toHaveLength(4);
  expect(screen.getByText(`${prefix}-23`)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Selanjutnya" }).disabled).toBe(true);
});

it.each(pages.slice(0, 7))("searches all records and resets pagination in %s", (name, element, prefix) => {
  render(element);
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  const search = screen.getByRole("textbox");
  fireEvent.change(search, { target: { value: `${prefix}-23` } });
  expect(screen.getByText(`${prefix}-23`)).toBeTruthy();
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  expect(screen.queryByRole("navigation")).toBeNull();
  fireEvent.change(search, { target: { value: "" } });
  expect(screen.getByText("Halaman 1 dari 3")).toBeTruthy();
});

it("keeps the payment page when returning from a detail on page two", () => {
  cache["payment:pay11"] = payments[10];
  render(<PaymentPage />);
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  const row = screen.getByText("PAY-11").closest("tr");
  fireEvent.click(within(row).getByRole("button", { name: "Detail" }));
  expect(screen.getByRole("heading", { name: "PAY-11" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Kembali" }));
  expect(screen.getByText("Halaman 2 dari 3")).toBeTruthy();
});

it("clamps the visible page after a cached deletion", () => {
  const { rerender } = render(<UnitPage />);
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  cache.units = cache.units.slice(0, 20);
  rerender(<UnitPage />);
  expect(screen.getByText("Halaman 2 dari 2")).toBeTruthy();
  expect(screen.getByText("Unit-11")).toBeTruthy();
});

it("paginates document line items without trimming the source", () => {
  const lines = makeRows(i => ({ detail_purchase_order_id: i, item: { item_name: `Kemasan-${i}` }, quantity: 1 }));
  render(<PackagingTable lines={lines} />);
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(11);
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  expect(screen.getByText("Kemasan-11")).toBeTruthy();
  expect(lines).toHaveLength(23);
});
