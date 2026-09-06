import { describe, it, expect } from "vitest";
import { newLine, linePayload, previewLine, quantitySummary, validateLine, poPayload, shippingPayload, isOwner, canEditQuotation, requiresOnline, paymentPayload, localDate } from "../src/utils/procurement";

const pr = { detail_purchase_request_id: "pr1", item_id: "item1", quantity: 101, base_unit_id: "pcs", base_unit: { unit_id: "pcs", unit_name: "PCS" } };
describe("procurement contract", () => {
  it("keeps multiple lines distinct and totals 101 pcs at different prices", () => {
    const box = { ...newLine(pr), unit_id: "box", quantity: 10, conversion_qty: 10, unit_price: 20000 };
    const loose = { ...newLine(pr), quantity: 1, unit_price: 2500 };
    expect(box.clientId).not.toBe(loose.clientId);
    expect(previewLine(box).subtotal + previewLine(loose).subtotal).toBe(202500);
    expect(quantitySummary([pr], [box, loose])[0]).toMatchObject({ offered_quantity: 101, difference: 0, status: "exact" });
    expect(linePayload({ ...box, base_quantity: 999, quotation_number: "fake" })).toEqual({
      detail_purchase_request_id: "pr1", unit_id: "box", quantity: 10, conversion_qty: 10, unit_price: 20000, discount_percentage: 0,
    });
  });
  it("requires explicit approval for under and over supply", () => {
    for (const quantity of [10, 11]) {
      const summary = quantitySummary([pr], [{ detail_purchase_request_id: "pr1", quantity, conversion_qty: 10 }]);
      expect(() => poPayload({ order_date: "2026-09-05" }, summary)).toThrow(/Konfirmasi/);
      expect(poPayload({ order_date: "2026-09-05", accept_quantity_difference: true, expected_delivery_date: "2026-09-10", po_number: "fake" }, summary))
        .toEqual({ order_date: "2026-09-05", notes: null, accept_quantity_difference: true });
    }
  });
  it("validates discrete units and base conversion", () => {
    expect(validateLine({ ...newLine(pr), unit_price: 0 }, pr)).toEqual({});
    expect(validateLine({ ...newLine(pr), quantity: 1.5, conversion_qty: 10, unit_price: -1 }, pr)).toHaveProperty("conversion_qty");
  });
  it("locks selected, expired and delivered quotation actions", () => {
    expect(canEditQuotation({ status: "submitted", valid_until: "2026-09-05" }, "2026-09-05")).toBe(true);
    for (const status of ["po_created", "not_selected", "cancelled"]) expect(canEditQuotation({ status })).toBe(false);
    expect(canEditQuotation({ status: "submitted", valid_until: "2026-09-04" }, "2026-09-05")).toBe(false);
  });
  it("does not infer ownership from role or missing relation", () => {
    const user = { id: "owner", role: "supplier" };
    expect(isOwner({ purchase_order_supplier: { user_id: "owner" } }, user)).toBe(true);
    expect(isOwner({ supplier_id: "owner" }, user)).toBe(false);
    expect(isOwner({ purchase_order_supplier: { user_id: "other" } }, user)).toBe(false);
    expect(isOwner({ purchase_order_supplier: { user_id: "owner" } }, { ...user, role: "admin" })).toBe(false);
  });
  it("sends calendar dates with no supplier id and rejects invalid dates", () => {
    const po = { order_date: "2026-09-05", shipping_date: "2026-09-05" };
    const dates = { shipping_date: "2026-09-05", expected_delivery_date: "2026-09-08", supplier_id: "fake" };
    expect(shippingPayload(po, dates, false, "2026-09-05")).toEqual({ status: "shipping", shipping_date: "2026-09-05", expected_delivery_date: "2026-09-08" });
    expect(shippingPayload(po, dates, true)).toEqual({ expected_delivery_date: "2026-09-08" });
    for (const shipping_date of ["2026-09-04", "2026-09-06", "2026-02-30"]) expect(() => shippingPayload(po, { ...dates, shipping_date }, false, "2026-09-05")).toThrow();
    expect(() => shippingPayload(po, { ...dates, expected_delivery_date: "2026-09-04" }, false, "2026-09-05")).toThrow();
    expect(localDate(new Date(2026, 8, 5, 0, 1))).toBe("2026-09-05");
  });
  it("never builds document numbers in the payment payload", () => {
    expect(paymentPayload({ paymentNumber: "fake", amount: "123", paymentMethod: "cash", paymentDate: "2026-09-05" }))
      .toEqual({ amount: 123, payment_method: "cash", payment_date: "2026-09-05", notes: null });
  });
  it("protects nested transaction endpoints but leaves ordinary offline features intact", () => {
    for (const path of ["/supplier-quotations/1/details", "/supplier-quotations/1/purchase-order", "/purchase-orders/1/status", "/purchase-orders/1/payments", "/payments/1/confirm"]) expect(requiresOnline(path, "PATCH")).toBe(true);
    expect(requiresOnline("/purchase-orders", "GET")).toBe(false);
    expect(requiresOnline("/items", "POST")).toBe(false);
  });
});
