import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import useCachedList from "../src/hooks/useCachedList";
import CacheStore from "../src/services/CacheStore";

beforeEach(() => CacheStore.clearAll());
afterEach(cleanup);
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

it("shows cache immediately and revalidates without clearing the list", async () => {
  CacheStore.set("items", [{ id: 1 }]);
  const pending = deferred();
  const service = { getAll: vi.fn(() => pending.promise) };
  const { result } = renderHook(() => useCachedList("items", service));
  expect(result.current.data).toEqual([{ id: 1 }]);
  expect(result.current.loading).toBe(false);
  expect(result.current.stale).toBe(true);
  await waitFor(() => expect(service.getAll).toHaveBeenCalledTimes(1));
  await act(async () => pending.resolve([{ id: 2 }]));
  await waitFor(() => expect(result.current.stale).toBe(false));
  expect(result.current.data).toEqual([{ id: 2 }]);
});

it("shares requests between readers and updates both after invalidation", async () => {
  const pending = deferred();
  const service = { getAll: vi.fn(() => pending.promise) };
  const { result } = renderHook(() => [useCachedList("shared", service), useCachedList("shared", service)]);
  await waitFor(() => expect(service.getAll).toHaveBeenCalledTimes(1));
  await act(async () => pending.resolve([1]));
  service.getAll.mockResolvedValue([2]);
  act(() => CacheStore.invalidate("shared"));
  await waitFor(() => expect(result.current[0].data).toEqual([2]));
  expect(result.current[1].data).toEqual([2]);
  expect(service.getAll).toHaveBeenCalledTimes(2);
});

it("supports object results, skips disabled queries, and isolates switched keys", async () => {
  const first = deferred();
  const service = { getById: vi.fn((id) => id === "one" ? first.promise : Promise.resolve({ id })) };
  const { result, rerender } = renderHook(({ id }) => useCachedList("detail:" + id, service, "getById", {
    enabled: Boolean(id), args: [id], resultType: "object",
  }), { initialProps: { id: null } });
  expect(result.current.data).toBeNull();
  expect(service.getById).not.toHaveBeenCalled();
  rerender({ id: "one" });
  await waitFor(() => expect(service.getById).toHaveBeenCalledTimes(1));
  rerender({ id: "two" });
  await waitFor(() => expect(result.current.data).toEqual({ id: "two" }));
  await act(async () => first.resolve({ id: "one" }));
  expect(result.current.data).toEqual({ id: "two" });
});

it("exposes retry failures and refresh resolves after successful recovery", async () => {
  CacheStore.set("items", [1]);
  const service = { getAll: vi.fn().mockRejectedValue(Error("Network unavailable")) };
  const { result } = renderHook(() => useCachedList("items", service));
  await waitFor(() => expect(result.current.error?.message).toBe("Network unavailable"));
  expect(result.current.data).toEqual([1]);
  expect(result.current.loading).toBe(false);
  service.getAll.mockResolvedValue([2]);
  await act(async () => expect(await result.current.refresh()).toEqual([2]));
  expect(result.current.error).toBeNull();
  expect(result.current.stale).toBe(false);
});

it("refreshes on focus and stops listening after unmount", async () => {
  const service = { getAll: vi.fn().mockResolvedValue([1]) };
  const { result, unmount } = renderHook(() => useCachedList("items", service));
  await waitFor(() => expect(result.current.stale).toBe(false));
  service.getAll.mockResolvedValue([2]);
  await new Promise((resolve) => setTimeout(resolve, 120));
  act(() => window.dispatchEvent(new Event("focus")));
  await waitFor(() => expect(result.current.data).toEqual([2]));
  unmount();
  const calls = service.getAll.mock.calls.length;
  window.dispatchEvent(new Event("focus"));
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(service.getAll).toHaveBeenCalledTimes(calls);
});
