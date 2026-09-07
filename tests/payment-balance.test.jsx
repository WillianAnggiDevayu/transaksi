import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
vi.mock("../src/services/PurchaseOrderService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../src/services/PaymentService", () => ({ default: { getByPurchaseOrderWithSummary: vi.fn(), getById: vi.fn(), create: vi.fn(), delete: vi.fn(), confirm: vi.fn() } }));
vi.mock("../src/services/ConfirmationService", () => ({ confirmAction: vi.fn() }));
import PurchaseOrderService from "../src/services/PurchaseOrderService";
import PaymentService from "../src/services/PaymentService";
import { confirmAction } from "../src/services/ConfirmationService";
import PaymentPage from "../src/pages/admin-akuntan/PaymentPage";

const order = { purchase_order_id: "po1", po_number: "PO-1", status: "draft", total: "100000.00" };
const summary = { total_amount: "100000.00", confirmed_amount: "40000.00", remaining_amount: "60000.00" };
const payment = { payment_id: "pay1", payment_number: "PAY-1", purchase_order_id: "po1", status: "draft", amount: "60000.00" };
beforeEach(() => {
  vi.resetAllMocks();
  PurchaseOrderService.getAll.mockResolvedValue([order, { ...order, purchase_order_id: "po2", po_number: "PO-2" }]);
  PaymentService.getByPurchaseOrderWithSummary.mockResolvedValue({ payments: [payment], summary });
  PaymentService.getById.mockResolvedValue(payment);
  confirmAction.mockResolvedValue(true);
});
afterEach(cleanup);
async function openForm() {
  await waitFor(() => expect(screen.getByText("Buat Pembayaran").disabled).toBe(false));
  fireEvent.click(screen.getByText("Buat Pembayaran"));
}

it.each(["-1", "0", "1.001", "100000.01", "60000.01"])("rejects %s before creating a payment", async (amount) => {
  render(<PaymentPage purchaseOrder={order} />);
  await openForm();
  fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: amount } });
  fireEvent.click(screen.getByText("Simpan Pembayaran"));
  expect(screen.getByLabelText("Nominal").getAttribute("aria-invalid")).toBe("true");
  expect(PaymentService.create).not.toHaveBeenCalled();
});

it("accepts the exact balance and refreshes the summary callback", async () => {
  const onPaymentSummary = vi.fn();
  render(<PaymentPage purchaseOrder={order} onPaymentSummary={onPaymentSummary} />);
  await openForm();
  fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "60000.00" } });
  fireEvent.click(screen.getByText("Simpan Pembayaran"));
  await waitFor(() => expect(PaymentService.create).toHaveBeenCalledWith("po1", expect.objectContaining({ amount: 60000 })));
  await waitFor(() => expect(onPaymentSummary).toHaveBeenCalledTimes(2));
});

it("disables creation when the balance is zero", async () => {
  PaymentService.getByPurchaseOrderWithSummary.mockResolvedValue({ payments: [], summary: { ...summary, confirmed_amount: "100000.00", remaining_amount: "0.00" } });
  render(<PaymentPage purchaseOrder={order} />);
  await screen.findByText("Lunas");
  expect(screen.getByText("Buat Pembayaran").disabled).toBe(true);
});

it("blocks saving while summary reload fails, preserving the form", async () => {
  render(<PaymentPage purchaseOrder={order} />);
  await openForm();
  fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "500" } });
  PaymentService.create.mockRejectedValue(new Error("Koneksi gagal"));
  PaymentService.getByPurchaseOrderWithSummary.mockRejectedValue(new Error("Ringkasan gagal"));
  fireEvent.click(screen.getByText("Simpan Pembayaran"));
  await screen.findAllByText("Ringkasan gagal");
  expect(screen.getByText("Simpan Pembayaran").disabled).toBe(true);
  expect(screen.getByLabelText("Nominal").value).toBe("500");
});

it("switches the displayed balance with the selected PO", async () => {
  PaymentService.getByPurchaseOrderWithSummary.mockImplementation(async (id) => ({ payments: [], summary: id === "po1" ? summary : { ...summary, confirmed_amount: "0.00", remaining_amount: "100000.00" } }));
  render(<PaymentPage />);
  await openForm();
  fireEvent.change(screen.getByLabelText("Purchase Order"), { target: { value: "po1" } });
  expect(screen.getByLabelText("Nominal").max).toBe("60000.00");
  fireEvent.change(screen.getByLabelText("Purchase Order"), { target: { value: "po2" } });
  expect(screen.getByLabelText("Nominal").max).toBe("100000.00");
});

it.each(["draft", "waiting_confirmation", "rejected"])("deletes a %s payment after confirmation", async (status) => {
  PaymentService.getById.mockResolvedValue({ ...payment, status });
  render(<PaymentPage purchaseOrder={order} />);
  fireEvent.click(await screen.findByText("Detail"));
  await waitFor(() => expect(screen.getByText("Hapus Pembayaran").disabled).toBe(false));
  PaymentService.getByPurchaseOrderWithSummary.mockResolvedValue({ payments: [], summary });
  fireEvent.click(screen.getByText("Hapus Pembayaran"));
  await waitFor(() => expect(PaymentService.delete).toHaveBeenCalledWith("pay1"));
  await screen.findByText("Belum ada pembayaran.");
  expect(confirmAction).toHaveBeenCalled();
});

it("does not delete when the dialog is cancelled", async () => {
  confirmAction.mockResolvedValue(false);
  render(<PaymentPage purchaseOrder={order} />);
  fireEvent.click(await screen.findByText("Detail"));
  await waitFor(() => expect(screen.getByText("Hapus Pembayaran").disabled).toBe(false));
  fireEvent.click(screen.getByText("Hapus Pembayaran"));
  await waitFor(() => expect(confirmAction).toHaveBeenCalled());
  expect(PaymentService.delete).not.toHaveBeenCalled();
});

it("does not offer deletion for a confirmed payment", async () => {
  PaymentService.getById.mockResolvedValue({ ...payment, status: "confirmed" });
  render(<PaymentPage purchaseOrder={order} />);
  fireEvent.click(await screen.findByText("Detail"));
  await screen.findByText("Dikonfirmasi");
  expect(screen.queryByText("Hapus Pembayaran")).toBeNull();
});

it("refreshes the balance and PO callback after confirmation", async () => {
  const onPaymentSummary = vi.fn();
  PaymentService.getById.mockResolvedValue({ ...payment, status: "waiting_confirmation" });
  render(<PaymentPage purchaseOrder={order} onPaymentSummary={onPaymentSummary} />);
  fireEvent.click(await screen.findByText("Detail"));
  await waitFor(() => expect(screen.getByText("Konfirmasi").disabled).toBe(false));
  const paid = { ...summary, confirmed_amount: "100000.00", remaining_amount: "0.00" };
  PaymentService.getByPurchaseOrderWithSummary.mockResolvedValue({ payments: [{ ...payment, status: "confirmed" }], summary: paid });
  fireEvent.click(screen.getByText("Konfirmasi"));
  await screen.findByText("Lunas");
  expect(onPaymentSummary).toHaveBeenLastCalledWith("po1", paid);
  expect(screen.getByText("Buat Pembayaran").disabled).toBe(true);
});

it("shows a changed server balance error beside the amount without clearing input", async () => {
  PaymentService.create.mockRejectedValue({ message: "Validasi gagal", data: { errors: { amount: ["Sisa tagihan berubah"] } } });
  render(<PaymentPage purchaseOrder={order} />);
  await openForm();
  fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "60000" } });
  fireEvent.click(screen.getByText("Simpan Pembayaran"));
  await screen.findByText("Sisa tagihan berubah");
  expect(screen.getByLabelText("Nominal").value).toBe("60000");
  expect(screen.getByLabelText("Nominal").getAttribute("aria-invalid")).toBe("true");
});
