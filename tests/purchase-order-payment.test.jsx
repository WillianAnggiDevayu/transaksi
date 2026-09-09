import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  fireEvent.click(await screen.findByText("Detail"));
  await waitFor(() => expect(screen.getByText("Buat Pembayaran").disabled).toBe(false)); await waitFor(() => expect(screen.getByText("Buat Pembayaran").disabled).toBe(false)); fireEvent.click(screen.getByText("Buat Pembayaran"));
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
