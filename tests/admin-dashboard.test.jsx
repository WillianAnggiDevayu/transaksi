import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import DashboardAdmin from "../src/pages/admin/DashboardAdmin";
import ItemService from "../src/services/ItemService";
import SupplierService from "../src/services/SupplierService";
import UserService from "../src/services/UserService";
import PurchaseRequestService from "../src/services/PurchaseRequestService";
import PurchaseOrderService from "../src/services/PurchaseOrderService";

vi.mock("../src/services/ItemService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../src/services/SupplierService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../src/services/UserService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../src/services/PurchaseRequestService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../src/services/PurchaseOrderService", () => ({ default: { getAll: vi.fn() } }));
const services = [ItemService, SupplierService, UserService, PurchaseRequestService, PurchaseOrderService];
beforeEach(() => {
  vi.resetAllMocks();
  services.forEach((service) => service.getAll.mockResolvedValue([]));
});
afterEach(cleanup);

it("does not present zero metrics or an empty-order message while loading", () => {
  services.forEach((service) => service.getAll.mockReturnValue(new Promise(() => {})));
  render(<DashboardAdmin />);
  expect(screen.getByRole("status").textContent).toContain("Memuat");
  screen.getAllByRole("article").forEach((card) => {
    expect(within(card).getByText("—")).toBeTruthy();
    expect(within(card).queryByText("0")).toBeNull();
  });
  expect(screen.queryByText("Belum ada purchase order")).toBeNull();
  expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
  expect(screen.getAllByText("—")).toHaveLength(13);
});

it("shows empty data with a zero completion rate and working navigation", async () => {
  const onNavigate = vi.fn();
  render(<DashboardAdmin onNavigate={onNavigate} />);
  await screen.findByText("Belum ada purchase order");
  expect(within(screen.getByRole("article", { name: "Tingkat penyelesaian PO" })).getByText("0%")).toBeTruthy();
  const shortcuts = [
    ["Buka procurement", "procurementDashboard"], ["Lihat semua PO", "purchaseOrders"],
    [/Stok barang menipis/, "items"], [/PO belum lunas/, "payments"],
    [/PR masih aktif/, "purchaseRequests"], [/^Barang/, "items"],
    [/Supplier terdaftar/, "suppliers"], [/Pengguna/, "users"],
  ];
  shortcuts.forEach(([name, target]) => {
    fireEvent.click(screen.getByRole("button", { name }));
    expect(onNavigate).toHaveBeenLastCalledWith(target);
  });
});

it("keeps failed sources unavailable while successful metrics remain usable", async () => {
  PurchaseOrderService.getAll.mockRejectedValue(new Error("Unavailable"));
  SupplierService.getAll.mockRejectedValue(new Error("Unavailable"));
  ItemService.getAll.mockResolvedValue([{ stock: 5 }, { stock: 6 }]);
  render(<DashboardAdmin />);
  await screen.findByRole("alert");
  for (const name of ["Total nilai pembelian", "Purchase order berjalan", "Tingkat penyelesaian PO"]) {
    expect(within(screen.getByRole("article", { name })).getByText("Tidak tersedia")).toBeTruthy();
  }
  expect(within(screen.getByRole("button", { name: /Stok barang menipis/ })).getByText("1")).toBeTruthy();
  expect(within(screen.getByRole("button", { name: /Supplier terdaftar/ })).getByText("Tidak tersedia")).toBeTruthy();
  expect(screen.getByText("Data purchase order tidak tersedia")).toBeTruthy();
  expect(screen.queryByText("Belum ada purchase order")).toBeNull();
  expect(screen.getAllByRole("progressbar")).toHaveLength(1);
});

it("calculates totals, preserves long text and large amounts, and shows only the newest five orders", async () => {
  const statuses = ["completed", "failed", "cancelled", "shipping", "draft", "completed"];
  const name = "Administrator Pengadaan Cabang Jakarta dan Wilayah Indonesia Timur";
  const supplier = "PT Penyedia Barang dan Perlengkapan Operasional Nusantara";
  PurchaseOrderService.getAll.mockResolvedValue(statuses.map((status, index) => ({
    purchase_order_id: index + 1, po_number: `PO-${index + 1}`,
    created_at: `2026-09-0${index + 1}T10:00:00Z`, order_date: `2026-09-0${index + 1}`,
    status, total: "1000000000000", payment_status: index === 5 ? "paid" : "unpaid",
    purchase_order_supplier: { supplier_name: supplier },
  })));
  PurchaseRequestService.getAll.mockResolvedValue([{ status: "draft" }, { status: "completed" }]);
  render(<DashboardAdmin user={{ name }} />);
  const table = await screen.findByRole("table");
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(name);
  const totalCard = screen.getByRole("article", { name: "Total nilai pembelian" });
  expect(totalCard.textContent.replace(/\s/g, "")).toContain("Rp4.000.000.000.000");
  expect(within(screen.getByRole("article", { name: "Purchase order berjalan" })).getByText("2")).toBeTruthy();
  expect(within(screen.getByRole("article", { name: "Tingkat penyelesaian PO" })).getByText("33%")).toBeTruthy();
  expect(within(screen.getByRole("button", { name: /PO belum lunas/ })).getByText("3")).toBeTruthy();
  expect(within(table).getAllByRole("row")).toHaveLength(6);
  expect(within(table).getAllByRole("row")[1].textContent).toContain("PO-6");
  expect(within(table).queryByText("PO-1")).toBeNull();
  expect(within(table).getAllByText(supplier)).toHaveLength(5);
  expect(screen.getByRole("progressbar", { name: "PR aktif" }).getAttribute("aria-valuenow")).toBe("50");
});
