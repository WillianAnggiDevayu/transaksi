import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/services/ApiClient", () => ({ default: { get: vi.fn(), delete: vi.fn() } }));
import ApiClient from "../src/services/ApiClient";
import PaymentService from "../src/services/PaymentService";
beforeEach(() => vi.resetAllMocks());
it("preserves the legacy array and exposes the new summary separately", async () => {
  const payments = [{ payment_id: "p1" }];
  const summary = { total_amount: "100.00", confirmed_amount: "40.00", remaining_amount: "60.00" };
  ApiClient.get.mockResolvedValue({ data: payments, meta: { payment_summary: summary } });
  await expect(PaymentService.getByPurchaseOrder("po1")).resolves.toEqual(payments);
  await expect(PaymentService.getByPurchaseOrderWithSummary("po1")).resolves.toEqual({ payments, summary });
});
it("rejects a missing summary instead of assuming an unpaid PO", async () => {
  ApiClient.get.mockResolvedValue({ data: [] });
  await expect(PaymentService.getByPurchaseOrderWithSummary("po1")).rejects.toThrow(/Ringkasan/);
});
it("uses DELETE for the selected payment", async () => {
  await PaymentService.delete("p1");
  expect(ApiClient.delete).toHaveBeenCalledWith("/payments/p1");
});
