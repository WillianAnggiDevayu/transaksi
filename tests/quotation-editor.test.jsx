import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import QuotationEditor from "../src/components/QuotationEditor";
const pr = { detail_purchase_request_id: "pr1", item_id: "item1", quantity: 101, base_unit_id: "pcs", base_unit: { unit_id: "pcs", unit_name: "PCS" }, detail_purchase_request_item: { item_name: "Sirup" } };
const units = [{ unit_id: "pcs", unit_name: "PCS" }, { unit_id: "box", unit_name: "Kardus" }];
afterEach(cleanup);
describe("quotation form", () => {
  it("submits two packaging lines for the same PR without document numbers", async () => {
    const save = vi.fn().mockResolvedValue({});
    render(<QuotationEditor requests={[pr]} units={units} onSave={save} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Tambah kemasan"));
    const quantities = screen.getAllByLabelText("Jumlah kemasan");
    fireEvent.change(quantities[0], { target: { value: "10" } });
    fireEvent.change(quantities[1], { target: { value: "1" } });
    fireEvent.change(screen.getAllByLabelText("Satuan penawaran")[0], { target: { value: "box" } });
    fireEvent.change(screen.getAllByLabelText("Satuan penawaran")[1], { target: { value: "pcs" } });
    fireEvent.change(screen.getByLabelText("Isi per Kardus (PCS)"), { target: { value: "10" } });
    const prices = screen.getAllByLabelText("Harga per satuan penawaran");
    fireEvent.change(prices[0], { target: { value: "20000" } });
    fireEvent.change(prices[1], { target: { value: "2500" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const payload = save.mock.calls[0][0];
    expect(payload.details).toHaveLength(2);
    expect(payload.details.map(line => line.quantity)).toEqual([10, 1]);
    expect(payload.details.map(line => line.detail_purchase_request_id)).toEqual(["pr1", "pr1"]);
    expect(JSON.stringify(payload)).not.toMatch(/base_quantity|base_unit_id|quotation_number|clientId/);
  });
  it("starts a new quotation line with an empty unit and zero values", () => {
    render(<QuotationEditor requests={[pr]} units={units} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Satuan penawaran").value).toBe("");
    expect(screen.getByLabelText("Jumlah kemasan").value).toBe("0");
    expect(screen.getByLabelText("Isi per - (PCS)").value).toBe("0");
    expect(screen.getByLabelText("Harga per satuan penawaran").value).toBe("0");
  });
  it("keeps the form and line values when saving fails", async () => {
    const close = vi.fn();
    const save = vi.fn().mockRejectedValue(Object.assign(new Error("Invalid quantity"), { data: { errors: { "details.0.quantity": ["Quantity rejected"] } } }));
    render(<QuotationEditor requests={[pr]} units={units} onSave={save} onClose={close} />);
    fireEvent.change(screen.getByLabelText("Satuan penawaran"), { target: { value: "pcs" } });
    fireEvent.change(screen.getByLabelText("Jumlah kemasan"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Harga per satuan penawaran"), { target: { value: "2500" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(screen.getAllByText(/Quantity rejected/).length).toBeGreaterThan(0));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("2500")).toBeTruthy();
    expect(within(screen.getByRole("group")).getByText("Hapus baris").disabled).toBe(true);
  });
});
