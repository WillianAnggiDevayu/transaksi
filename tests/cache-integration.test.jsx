import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import useCachedList from "../src/hooks/useCachedList";
import CacheStore from "../src/services/CacheStore";
import ItemService from "../src/services/ItemService";
import PaymentService from "../src/services/PaymentService";
import ApiClient from "../src/services/ApiClient";
import OfflineQueue from "../src/services/OfflineQueue";

vi.mock("../src/services/NotificationService", () => ({ notifyMutationSuccess: vi.fn() }));
vi.mock("../src/services/OfflineQueue", () => ({ default: {
  mergeOptimistic: vi.fn(), addToQueue: vi.fn(), getQueue: vi.fn(), removeFromQueue: vi.fn(),
} }));
const response = (body) => ({ ok: true, text: async () => JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  OfflineQueue.mergeOptimistic.mockImplementation(async (_, __, rows) => rows);
  OfflineQueue.getQueue.mockResolvedValue([]);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("updates every items reader once after a real service mutation", async () => {
  const rows = [{ item_id: "one", item_name: "A", stock: 1 }];
  const network = vi.fn(async (_, options) => {
    if (options.method === "POST") rows.push({ item_id: "two", ...JSON.parse(options.body) });
    return response({ data: options.method === "POST" ? rows.at(-1) : [...rows] });
  });
  vi.stubGlobal("fetch", network);
  const { result } = renderHook(() => [useCachedList("items", ItemService), useCachedList("items", ItemService)]);
  await waitFor(() => expect(result.current[0].stale).toBe(false));
  await act(async () => ItemService.create({ item_name: "B", stock: 2, unit_id: "pcs" }));
  await waitFor(() => expect(result.current[0].data).toHaveLength(2));
  expect(result.current[1].data).toEqual(result.current[0].data);
  expect(Array.isArray(CacheStore.get("items"))).toBe(true);
  expect(network.mock.calls.filter(([, options]) => !options.method)).toHaveLength(2);
});

it("merges queued changes with retained data and refreshes after queue removal", async () => {
  const rows = [{ item_id: "one", item_name: "A", stock: 1 }];
  let queue = [];
  OfflineQueue.addToQueue.mockImplementation(async (entry) => { queue.push({ ...entry, id: "queue-one" }); });
  OfflineQueue.getQueue.mockImplementation(async () => queue);
  OfflineQueue.removeFromQueue.mockImplementation(async () => { queue = []; });
  OfflineQueue.mergeOptimistic.mockImplementation(async (_, __, server, normalize) => [
    ...server, ...queue.map((entry) => ({ ...normalize({ ...entry.payload, item_id: entry.tempId }), _pendingAction: "create", _pendingSync: true })),
  ]);
  vi.stubGlobal("fetch", vi.fn(async (_, options) => {
    if (!navigator.onLine) throw new TypeError("Offline");
    if (options.method === "POST") rows.push({ item_id: "two", ...JSON.parse(options.body) });
    return response({ data: [...rows] });
  }));
  const { result } = renderHook(() => useCachedList("items", ItemService));
  await waitFor(() => expect(result.current.stale).toBe(false));
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  await act(async () => ItemService.create({ item_name: "B", stock: 2 }));
  await waitFor(() => expect(result.current.data).toHaveLength(2));
  expect(result.current.error?.message).toBe("Offline");
  expect(result.current.data[1]._pendingSync).toBe(true);
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  await act(async () => ApiClient.syncPendingQueue());
  await waitFor(() => expect(result.current.stale).toBe(false));
  expect(queue).toHaveLength(0);
  expect(result.current.data.map((row) => row.item_id)).toEqual(["one", "two"]);
  expect(result.current.data.some((row) => row._pendingSync)).toBe(false);
});

it("refreshes payment history and authoritative balance together after confirmation", async () => {
  let paid = false;
  vi.stubGlobal("fetch", vi.fn(async (_, options) => {
    if (options.method === "PATCH") { paid = true; return response({ data: {} }); }
    return response({
      data: [{ payment_id: "pay1", status: paid ? "confirmed" : "waiting_confirmation" }],
      meta: { payment_summary: { total_amount: "100.00", confirmed_amount: paid ? "100.00" : "0.00", remaining_amount: paid ? "0.00" : "100.00" } },
    });
  }));
  const { result } = renderHook(() => useCachedList('payment-overview:["po1"]', PaymentService, "getOverview", { args: [["po1"]] }));
  await waitFor(() => expect(result.current.stale).toBe(false));
  expect(result.current.data[0].summary.remaining_amount).toBe("100.00");
  await act(async () => PaymentService.confirm("pay1"));
  await waitFor(() => expect(result.current.data[0].summary.remaining_amount).toBe("0.00"));
  expect(result.current.data[0].payments[0].status).toBe("confirmed");
  expect(CacheStore.get("payment-summary:po1").summary.remaining_amount).toBe("0.00");
});
