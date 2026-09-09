import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("../src/hooks/useCachedList", () => ({ default: vi.fn() }));
vi.mock("../src/services/PurchaseRequestService", () => ({ default: { create: vi.fn() } }));
import useCachedList from "../src/hooks/useCachedList";
import PurchaseRequestService from "../src/services/PurchaseRequestService";
import PurchaseRequestPage from "../src/pages/admin-akuntan/PurchaseRequestPage";

const items = [
  { item_id: 1, item_name: "Kertas A4", item_unit: { unit_name: "Rim" } },
  { item_id: 2, item_name: "Pulpen Biru", item_unit: { unit_name: "Pcs" } },
  ...Array.from({ length: 10 }, (_, i) => ({ item_id: i + 3, item_name: `Barang ${i + 3}` })),
  { id: 13, nama_barang: "Map Plastik" },
];
const empty = [];
let cachedItems;
beforeEach(() => {
  vi.resetAllMocks();
  cachedItems = items;
  // jsdom has no layout observer; keep the real Headless UI interactions.
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  useCachedList.mockImplementation((key, service, method, options = {}) => ({
    data: key === "items" ? cachedItems : options.resultType === "object" ? null : empty,
    error: null, loading: false, stale: false, refreshing: false, refresh: async () => {},
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openForm() {
  const user = userEvent.setup();
  const view = render(<PurchaseRequestPage />);
  await user.click(screen.getByRole("button", { name: "Buat Purchase Request" }));
  const form = screen.getByRole("heading", { name: "Buat Purchase Request" }).closest("form");
  return { user, form, ...view };
}
const input = (row = 1) => screen.getByRole("combobox", { name: `Barang baris ${row}` });
async function choose(user, name, row = 1) {
  await user.click(input(row));
  await user.clear(input(row));
  await user.type(input(row), name);
  await user.click(await screen.findByRole("option", { name }));
}

it("uses one searchable dropdown, filters names, and restores all options when cleared", async () => {
  const { user, form } = await openForm();
  expect(screen.queryByRole("searchbox")).toBeNull();
  expect(within(form).getAllByRole("combobox")).toHaveLength(1);
  expect(input().placeholder).toBe("Pilih atau cari barang…");
  await user.type(input(), "  KERTAS  ");
  expect(screen.getAllByRole("option").map(option => option.textContent)).toEqual(["Kertas A4"]);
  await user.clear(input());
  expect(screen.getAllByRole("option")).toHaveLength(items.length);
  expect(form.contains(screen.getByRole("listbox"))).toBe(false);
});

it("opens from the arrow and marks the chosen item on reopening", async () => {
  const { user } = await openForm();
  await user.click(screen.getByRole("button", { name: "Buka pilihan barang baris 1" }));
  await user.click(await screen.findByRole("option", { name: "Kertas A4" }));
  expect(input().value).toBe("Kertas A4");
  expect(screen.getByText("Rim")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Buka pilihan barang baris 1" }));
  expect((await screen.findByRole("option", { name: "Kertas A4" })).getAttribute("aria-selected")).toBe("true");
});

it("searches the complete item cache including legacy names beyond the first ten", async () => {
  const { user, form } = await openForm();
  await choose(user, "Map Plastik");
  expect(input().value).toBe("Map Plastik");
  fireEvent.submit(form);
  await waitFor(() => expect(PurchaseRequestService.create).toHaveBeenCalledWith(expect.objectContaining({
    details: [{ item_id: "13", quantity: 1, notes: null }],
  })));
});

it("shows no matches and restores the selection on Escape without changing other fields", async () => {
  const { user, form } = await openForm();
  await choose(user, "Kertas A4");
  fireEvent.change(within(form).getByRole("spinbutton"), { target: { value: "7" } });
  await user.type(within(form).getByPlaceholderText("Catatan item"), "Untuk kantor");
  await user.clear(input());
  await user.type(input(), "tidak-ada");
  expect(screen.getByRole("status").textContent).toBe("Barang tidak ditemukan.");
  await user.keyboard("{Escape}");
  expect(input().value).toBe("Kertas A4");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(screen.getByText("Rim")).toBeTruthy();
  expect(within(form).getByRole("spinbutton").value).toBe("7");
  expect(within(form).getByPlaceholderText("Catatan item").value).toBe("Untuk kantor");
});

it("restores the selection when clicking outside or leaving with Tab", async () => {
  const { user, form } = await openForm();
  await choose(user, "Kertas A4");
  await user.clear(input());
  await user.type(input(), "zzzz");
  await user.click(within(form).getByPlaceholderText("Catatan item"));
  expect(input().value).toBe("Kertas A4");
  await user.clear(input());
  await user.type(input(), "zzzz");
  await user.tab();
  expect(input().value).toBe("Kertas A4");
});

it("supports arrow keys and Enter without submitting the form", async () => {
  const { user } = await openForm();
  await user.click(input());
  await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");
  expect(input().getAttribute("aria-activedescendant")).toBeTruthy();
  await user.clear(input());
  await user.type(input(), "Pulpen");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(input().value).toBe("Pulpen Biru");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(PurchaseRequestService.create).not.toHaveBeenCalled();
});

it("keeps selections attached to their rows after deleting another row", async () => {
  const { user, form } = await openForm();
  await choose(user, "Kertas A4");
  await user.click(screen.getByRole("button", { name: "+ Tambah baris" }));
  await choose(user, "Pulpen Biru", 2);
  const remainingInput = input(2);
  await user.click(within(form).getAllByRole("button", { name: "Hapus" })[0]);
  expect(input()).toBe(remainingInput);
  expect(input().value).toBe("Pulpen Biru");
  await user.click(screen.getByRole("button", { name: "+ Tambah baris" }));
  expect(input(2).value).toBe("");
});

it("submits only selected item data, never query text or client row IDs", async () => {
  const { user, form } = await openForm();
  await choose(user, "Kertas A4");
  fireEvent.change(within(form).getByRole("spinbutton"), { target: { value: "3" } });
  fireEvent.submit(form);
  await waitFor(() => expect(PurchaseRequestService.create).toHaveBeenCalledWith({
    request_date: expect.any(String), notes: null,
    details: [{ item_id: "1", quantity: 3, notes: null }],
  }));
});

it("rejects free text without an actual selection", async () => {
  const { user, form } = await openForm();
  await user.type(input(), "Kertas A4");
  expect(input().checkValidity()).toBe(false);
  fireEvent.submit(form);
  await waitFor(() => expect(screen.getByText("Detail barang belum lengkap.")).toBeTruthy());
  expect(PurchaseRequestService.create).not.toHaveBeenCalled();
});

it("preserves the selection and quantity when cached items refresh", async () => {
  const { user, form, rerender } = await openForm();
  await choose(user, "Kertas A4");
  fireEvent.change(within(form).getByRole("spinbutton"), { target: { value: "5" } });
  cachedItems = items.map(item => ({ ...item }));
  rerender(<PurchaseRequestPage />);
  expect(input().value).toBe("Kertas A4");
  expect(within(form).getByRole("spinbutton").value).toBe("5");
  expect(input().checkValidity()).toBe(true);
});

it("clears the selection and query when cancelled and reopened", async () => {
  const { user, form } = await openForm();
  await choose(user, "Kertas A4");
  await user.click(within(form).getByRole("button", { name: "Batal" }));
  await user.click(screen.getByRole("button", { name: "Buat Purchase Request" }));
  expect(input().value).toBe("");
  await user.click(input());
  expect(await screen.findAllByRole("option")).toHaveLength(items.length);
});
