import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
vi.mock("../src/services/PurchaseOrderService", () => ({ default: { getAll: vi.fn(), getById: vi.fn(), updateStatus: vi.fn(), updateDeliveryEstimate: vi.fn() } }));
vi.mock("../src/services/AuthService", () => ({ default: { getUser: () => ({ id: "owner", role: "supplier" }) } }));
vi.mock("../src/services/PaymentService", () => ({ default: { getByPurchaseOrderWithSummary: vi.fn().mockResolvedValue({ payments: [], summary: { total_amount: "100.00", confirmed_amount: "0.00", remaining_amount: "100.00" } }) } }));
import Service from "../src/services/PurchaseOrderService";
import SupplierPurchaseOrder from "../src/pages/supplier/SupplierPurchaseOrder";
import { localDate } from "../src/utils/procurement";
const po = { purchase_order_id: "po1", po_number: "PO-SERVER-1", order_date: localDate(), status: "draft", purchase_order_supplier: { user_id: "owner" }, purchase_order_detail_purchase_order: [] };
beforeEach(() => { vi.clearAllMocks(); Service.getAll.mockResolvedValue([po]); Service.getById.mockResolvedValue(po); });
afterEach(cleanup);
it("collects both dates before sending and preserves form on failure", async () => {
  Service.updateStatus.mockRejectedValue(new Error("Connection lost"));
  render(<SupplierPurchaseOrder />);
  fireEvent.click(await screen.findByText("Detail"));
  fireEvent.click(await screen.findByText("Tandai PO Dikirim"));
  fireEvent.change(screen.getByLabelText("Estimasi tiba"), { target: { value: localDate() } });
  fireEvent.click(screen.getByText("Simpan"));
  await waitFor(() => expect(Service.updateStatus).toHaveBeenCalledWith("po1", "shipping", { status: "shipping", shipping_date: localDate(), expected_delivery_date: localDate() }));
  await screen.findAllByText(/Connection lost/);
  expect(screen.getByLabelText("Estimasi tiba").value).toBe(localDate());
});
it("does not offer shipping actions to another supplier", async () => {
  Service.getById.mockResolvedValue({ ...po, purchase_order_supplier: { user_id: "other" } });
  render(<SupplierPurchaseOrder />);
  fireEvent.click(await screen.findByText("Detail"));
  await screen.findByText("Detail Purchase Order");
  expect(screen.queryByText("Tandai PO Dikirim")).toBeNull();
});
it("locks schedule editing after delivery", async () => {
  Service.getById.mockResolvedValue({ ...po, status: "delivered", shipping_date: localDate() });
  render(<SupplierPurchaseOrder />);
  fireEvent.click(await screen.findByText("Detail"));
  await screen.findByText("Detail Purchase Order");
  expect(screen.queryByText("Tandai PO Dikirim")).toBeNull();
  expect(screen.queryByText("Ubah estimasi tiba")).toBeNull();
});
