import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/services/OfflineQueue", () => ({ default: { addToQueue: vi.fn(), getQueue: vi.fn(), removeFromQueue: vi.fn() } }));
vi.mock("../src/services/NotificationService", () => ({ notifyMutationSuccess: vi.fn() }));
import OfflineQueue from "../src/services/OfflineQueue";
import { ApiClient } from "../src/services/ApiClient";
import { notifyMutationSuccess } from "../src/services/NotificationService";
import AuthService from "../src/services/AuthService";
const client = new ApiClient("https://example.test/api");
beforeEach(() => { vi.clearAllMocks(); Object.defineProperty(navigator, "onLine", { configurable: true, value: true }); });

describe("authentication", () => {
  it.each(["/login", "/logout"])("does not queue %s when offline", async (path) => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    vi.stubGlobal("fetch", vi.fn());
    await expect(client.post(path, {})).rejects.toThrow(/server autentikasi/);
    expect(fetch).not.toHaveBeenCalled();
    expect(OfflineQueue.addToQueue).not.toHaveBeenCalled();
  });

  it("reports login fetch failure without storing credentials or a token", async () => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(AuthService.login("test@example.test", "test-password")).rejects.toThrow(/CORS/);
    expect(OfflineQueue.addToQueue).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBeNull();
    expect(notifyMutationSuccess).not.toHaveBeenCalled();
  });

  it("accepts the backend login response", async () => {
    localStorage.clear();
    const user = { id: "test-user", role: "admin" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ data: { user, token: "test-token" } }) }));
    await expect(AuthService.login("test@example.test", "test-password")).resolves.toEqual(user);
    expect(localStorage.getItem("token")).toBe("test-token");
    expect(OfflineQueue.addToQueue).not.toHaveBeenCalled();
    localStorage.clear();
  });

  it("removes legacy authentication entries without replaying them", async () => {
    OfflineQueue.getQueue.mockResolvedValue([
      { id: "login", path: "/login", method: "POST", payload: { password: "test-password" } },
      { id: "logout", path: "/logout", method: "POST", payload: {} },
    ]);
    vi.stubGlobal("fetch", vi.fn());
    await client.syncPendingQueue();
    expect(fetch).not.toHaveBeenCalled();
    expect(OfflineQueue.removeFromQueue).toHaveBeenCalledWith("login");
    expect(OfflineQueue.removeFromQueue).toHaveBeenCalledWith("logout");
  });
});
describe("online-only transactions", () => {
  it("does not queue or report success offline", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    await expect(client.post("/purchase-orders/1/payments", { amount: 1 })).rejects.toThrow(/online/);
    expect(OfflineQueue.addToQueue).not.toHaveBeenCalled();
    expect(notifyMutationSuccess).not.toHaveBeenCalled();
  });
  it("does not retry a network failure through the queue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("connection lost")));
    await expect(client.patch("/purchase-orders/1/status", { status: "shipping" })).rejects.toThrow(/online/);
    expect(OfflineQueue.addToQueue).not.toHaveBeenCalled();
  });
  it("preserves field errors from backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => JSON.stringify({ message: "Invalid", errors: { "details.1.quantity": ["Invalid quantity"] } }) }));
    await expect(client.post("/supplier-quotations/request-suppliers/1", {})).rejects.toMatchObject({ status: 422, data: { errors: { "details.1.quantity": ["Invalid quantity"] } } });
    expect(OfflineQueue.addToQueue).not.toHaveBeenCalled();
  });
  it("retains protected legacy entries and syncs only eligible entries", async () => {
    OfflineQueue.getQueue.mockResolvedValue([{ id: "blocked", path: "/payments/1/confirm", method: "PATCH", payload: {} }, { id: "ordinary", path: "/items", method: "POST", payload: { item_name: "A" } }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => '{"data":{}}' }));
    await client.syncPendingQueue();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain("/items");
    expect(OfflineQueue.removeFromQueue).toHaveBeenCalledWith("ordinary");
    expect(OfflineQueue.removeFromQueue).not.toHaveBeenCalledWith("blocked");
  });
});
