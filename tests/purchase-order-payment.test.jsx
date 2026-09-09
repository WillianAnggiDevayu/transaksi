import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("../src/services/PurchaseOrderService", () => ({ default: { getAll: vi.fn(), getById: vi.fn() } }));
vi.mock("../src/services/PaymentService", async (importOriginal) => ({ default: { getOverview: (await importOriginal()).default.getOverview, getByPurchaseOrder: vi.fn(), getByPurchaseOrderWithSummary: vi.fn(), delete: vi.fn(), confirm: vi.fn(), create: vi.fn(), getById: vi.fn(), submit: vi.fn() } }));
import PurchaseOrderService from "../src/services/PurchaseOrderService";
import PaymentService from "../src/services/PaymentService";
import PurchaseOrderPage from "../src/pages/admin-akuntan/PurchaseOrderPage";
import PaymentPage from "../src/pages/admin-akuntan/PaymentPage";
import { localDate } from "../src/utils/procurement";

const order = { purchase_order_id: "po1", po_number: "PO-1", status: "draft", total: 10000 };
beforeEach(() => {
  vi.resetAllMocks();
  PurchaseOrderService.getAll.mockResolvedValue([order]);
  PurchaseOrderService.getById.mockResolvedValue(order);
  PaymentService.getByPurchaseOrderWithSummary.mockResolvedValue({ payments: [], summary: { total_amount: "10000.00", confirmed_amount: "0.00", remaining_amount: "10000.00" } });
});
afterEach(cleanup);

it("creates a draft for the open PO and refreshes its payments", async () => {
  const payment = { payment_id: "pay1", payment_number: "PAY-1", status: "draft", amount: 5000 };
  PaymentService.create.mockImplementation(async () => {
    PaymentService.getByPurchaseOrderWithSummary.mockResolvedValue({ payments: [payment], summary: { total_amount: "10000.00", confirmed_amount: "0.00", remaining_amount: "10000.00" } });
    return payment;
  });
  PaymentService.getById.mockResolvedValue(payment);
  render(<PurchaseOrderPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Pembayaran" }));
  await screen.findByRole("tab", { name: "Pembayaran", selected: true });
  await waitFor(() => expect(screen.getByRole("button", { name: "Buat Pembayaran" }).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Buat Pembayaran" }));
  expect(screen.queryByLabelText("Purchase Order")).toBeNull();
  fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "5000" } });
  fireEvent.click(screen.getByText("Simpan Pembayaran"));
  await waitFor(() => expect(PaymentService.create).toHaveBeenCalledWith("po1", {
    amount: 5000, payment_method: "bank_transfer", payment_date: localDate(), notes: null,
  }));
  await screen.findByText("PAY-1");
  expect(PurchaseOrderService.getAll).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText("Detail"));
  await screen.findByText("Kirim Konfirmasi");
  expect(PaymentService.submit).not.toHaveBeenCalled();
});

it("retains payment inputs when the server rejects creation", async () => {
  PaymentService.create.mockRejectedValue(new Error("Nominal ditolak"));
  render(<PaymentPage purchaseOrder={order} />);
  await waitFor(() => expect(screen.getByText("Buat Pembayaran").disabled).toBe(false)); fireEvent.click(screen.getByText("Buat Pembayaran"));
  fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "5000" } });
  fireEvent.click(screen.getByText("Simpan Pembayaran"));
  await screen.findAllByText("Nominal ditolak");
  expect(screen.getByLabelText("Nominal").value).toBe("5000");
});

it.each(["cancelled", "failed"])("blocks payment creation for a %s PO", (status) => {
  render(<PaymentPage purchaseOrder={{ ...order, status }} />);
  expect(screen.getByText("Buat Pembayaran").disabled).toBe(true);
});

it("keeps PO selection available on the standalone payment page", async () => {
  render(<PaymentPage />);
  await waitFor(() => expect(screen.getByText("Buat Pembayaran").disabled).toBe(false)); fireEvent.click(screen.getByText("Buat Pembayaran"));
  await waitFor(() => expect(screen.getByLabelText("Purchase Order").options.length).toBe(2));
});

const summary = { total_amount: "10000.00", confirmed_amount: "0.00", remaining_amount: "10000.00" };
const deferred = () => {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
};

it.each([["Detail", "Detail PO"], ["Pembayaran", "Pembayaran"]])("opens %s directly on the %s tab", async (button, tab) => {
  render(<PurchaseOrderPage />);
  fireEvent.click(await screen.findByRole("button", { name: button }));
  expect(await screen.findByRole("tab", { name: tab, selected: true })).toBeTruthy();
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  if (tab === "Detail PO") expect(screen.queryByRole("button", { name: "Buat Pembayaran" })).toBeNull();
  else expect(screen.queryByRole("heading", { name: "Detail Barang" })).toBeNull();
  expect(screen.getByRole("heading", { name: "PO-1" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Kembali ke daftar PO" })).toBeTruthy();
});

it("supports keyboard tab navigation without duplicating payment loads", async () => {
  const user = userEvent.setup();
  render(<PurchaseOrderPage />);
  await user.click(await screen.findByRole("button", { name: "Pembayaran" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Buat Pembayaran" }).disabled).toBe(false));
  const calls = PaymentService.getByPurchaseOrderWithSummary.mock.calls.length;
  await user.click(screen.getByRole("tab", { name: "Detail PO" }));
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Pembayaran", selected: true })).toBeTruthy();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("tab", { name: "Detail PO", selected: true })).toBeTruthy();
  expect(PaymentService.getByPurchaseOrderWithSummary).toHaveBeenCalledTimes(calls);
});

it("retains PO search and pagination when returning from its payment tab", async () => {
  const orders = Array.from({ length: 23 }, (_, i) => ({ ...order, purchase_order_id: `po${i + 1}`, po_number: `PO-${i + 1}` }));
  PurchaseOrderService.getAll.mockResolvedValue(orders);
  PurchaseOrderService.getById.mockImplementation(async id => orders.find(row => row.purchase_order_id === id));
  render(<PurchaseOrderPage />);
  await screen.findByText("PO-1");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "PO-" } });
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  fireEvent.click(within(screen.getByText("PO-11").closest("tr")).getByRole("button", { name: "Pembayaran" }));
  await screen.findByRole("tab", { name: "Pembayaran", selected: true });
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke daftar PO" }));
  expect(screen.getByRole("textbox").value).toBe("PO-");
  expect(screen.getByText("Halaman 2 dari 3")).toBeTruthy();
  expect(screen.getByText("PO-11")).toBeTruthy();
});

it("retains payment search, pagination and transaction detail across tabs", async () => {
  const payments = Array.from({ length: 23 }, (_, i) => ({ payment_id: `pay${i + 1}`, payment_number: `PAY-${i + 1}`, purchase_order_id: "po1", status: "draft", amount: 100 }));
  PaymentService.getByPurchaseOrderWithSummary.mockResolvedValue({ payments, summary });
  PaymentService.getById.mockResolvedValue(payments[10]);
  render(<PurchaseOrderPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Pembayaran" }));
  await screen.findByRole("tab", { name: "Pembayaran", selected: true });
  await screen.findByText("PAY-1");
  fireEvent.change(screen.getByRole("textbox", { name: "Cari pembayaran atau PO" }), { target: { value: "PAY-" } });
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  fireEvent.click(within(screen.getByText("PAY-11").closest("tr")).getByRole("button", { name: "Detail" }));
  await screen.findByRole("heading", { name: "PAY-11" });
  fireEvent.click(screen.getByRole("tab", { name: "Detail PO" }));
  fireEvent.click(screen.getByRole("tab", { name: "Pembayaran" }));
  expect(screen.getByRole("heading", { name: "PAY-11" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Kembali", exact: true }));
  expect(screen.getByText("Halaman 2 dari 3")).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Cari pembayaran atau PO" }).value).toBe("PAY-");
  expect(screen.getByRole("tab", { name: "Pembayaran", selected: true })).toBeTruthy();
});

it("shows detail loading, handles failure and retries on the requested tab", async () => {
  PurchaseOrderService.getById.mockRejectedValueOnce(new Error("Detail PO gagal dimuat"));
  render(<PurchaseOrderPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Pembayaran" }));
  expect(screen.getByRole("status").textContent).toBe("Memuat detail purchase order...");
  expect(screen.queryByRole("button", { name: "Buat Pembayaran" })).toBeNull();
  expect(await screen.findByRole("alert")).toBeTruthy();
  PurchaseOrderService.getById.mockResolvedValue(order);
  fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  await screen.findByRole("tab", { name: "Pembayaran", selected: true });
  await screen.findByText("Belum ada pembayaran.");
});

it("ignores a late detail response after switching to another PO", async () => {
  const other = { ...order, purchase_order_id: "po2", po_number: "PO-2" };
  const first = deferred();
  const second = deferred();
  PurchaseOrderService.getAll.mockResolvedValue([order, other]);
  PurchaseOrderService.getById.mockImplementation(id => id === "po1" ? first.promise : second.promise);
  render(<PurchaseOrderPage />);
  fireEvent.click(within((await screen.findByText("PO-1")).closest("tr")).getByRole("button", { name: "Pembayaran" }));
  await waitFor(() => expect(PurchaseOrderService.getById).toHaveBeenCalledWith("po1", expect.any(Object)));
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke daftar PO" }));
  fireEvent.click(within(screen.getByText("PO-2").closest("tr")).getByRole("button", { name: "Pembayaran" }));
  await act(async () => first.resolve(order));
  expect(screen.queryByRole("heading", { name: "PO-1" })).toBeNull();
  expect(screen.queryByRole("tab")).toBeNull();
  await act(async () => second.resolve(other));
  await screen.findByRole("tab", { name: "Pembayaran", selected: true });
  await waitFor(() => expect(PaymentService.getByPurchaseOrderWithSummary).toHaveBeenCalledWith("po2", expect.any(Object)));
  expect(PaymentService.getByPurchaseOrderWithSummary.mock.calls.every(([id]) => id === "po2")).toBe(true);
});

it("never displays the previous PO payments while the new balance is loading", async () => {
  const other = { ...order, purchase_order_id: "po2", po_number: "PO-2" };
  const pending = deferred();
  PurchaseOrderService.getAll.mockResolvedValue([order, other]);
  PurchaseOrderService.getById.mockImplementation(async id => id === "po1" ? order : other);
  PaymentService.getByPurchaseOrderWithSummary.mockImplementation(id => id === "po1" ? Promise.resolve({ payments: [{ payment_id: "pay1", payment_number: "PAY-OLD", amount: 100 }], summary }) : pending.promise);
  render(<PurchaseOrderPage />);
  fireEvent.click(within((await screen.findByText("PO-1")).closest("tr")).getByRole("button", { name: "Pembayaran" }));
  await screen.findByText("PAY-OLD");
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke daftar PO" }));
  fireEvent.click(within(screen.getByText("PO-2").closest("tr")).getByRole("button", { name: "Pembayaran" }));
  await screen.findByRole("tab", { name: "Pembayaran", selected: true });
  expect(screen.queryByText("PAY-OLD")).toBeNull();
  expect(screen.getByRole("button", { name: "Buat Pembayaran" }).disabled).toBe(true);
  await act(async () => pending.resolve({ payments: [], summary }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Buat Pembayaran" }).disabled).toBe(false));
});
