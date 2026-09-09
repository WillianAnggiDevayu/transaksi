import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import CacheStore from "../src/services/CacheStore.js";

beforeEach(() => CacheStore.clearAll());
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};

test("shares requests, caches successful results, and force refresh bypasses data", async () => {
    const pending = deferred();
    let calls = 0;
    const loader = () => { calls++; return pending.promise; };
    const first = CacheStore.fetch("items", loader);
    const second = CacheStore.fetch("items", loader, { force: true });
    assert.equal(first, second);
    pending.resolve([1]);
    assert.deepEqual(await first, [1]);
    assert.equal(calls, 1);
    await CacheStore.fetch("items", () => { throw Error("must use cache"); });
    assert.deepEqual(await CacheStore.fetch("items", () => [2], { force: true }), [2]);
});

test("old responses cannot overwrite a newer invalidated request", async () => {
    const pending = deferred();
    const old = CacheStore.fetch("items", () => pending.promise);
    await Promise.resolve();
    CacheStore.invalidateAll();
    const result = await CacheStore.fetch("items", () => [2]);
    pending.resolve([1]);
    await assert.rejects(old, { name: "AbortError" });
    assert.deepEqual(result, [2]);
    assert.deepEqual(CacheStore.get("items"), [2]);
});

test("logout clears in-flight generations without restarting subscribers", async () => {
    const pending = deferred();
    const events = [];
    const off = CacheStore.subscribe("private", (_, event) => events.push(event));
    const old = CacheStore.fetch("private", () => pending.promise);
    await Promise.resolve();
    CacheStore.clearAll();
    pending.resolve(["previous account"]);
    await assert.rejects(old, { name: "AbortError" });
    assert.equal(CacheStore.has("private"), false);
    assert.equal(events.at(-1), "reset");
    off();
});

test("retains stale data on network failure but removes data on access denial", async () => {
    CacheStore.set("items", [1]);
    await assert.rejects(CacheStore.fetch("items", () => { throw Error("offline"); }, { force: true }));
    assert.deepEqual(CacheStore.get("items"), [1]);
    assert.equal(CacheStore.snapshot("items").stale, true);
    const denied = Object.assign(Error("forbidden"), { status: 403 });
    await assert.rejects(CacheStore.fetch("items", () => { throw denied; }, { force: true }));
    assert.equal(CacheStore.has("items"), false);
    assert.equal(CacheStore.snapshot("items").error, denied);
});

test("invalidates subscribed keys even before the first request succeeds", () => {
    const events = [];
    const off = CacheStore.subscribe("new", (_, event) => events.push(event));
    CacheStore.invalidateAll();
    assert.deepEqual(events, ["invalidate"]);
    off();
});

test("notifies every reader and waits for asynchronous normalized data", async () => {
    const seen = [];
    const off1 = CacheStore.subscribe("items", (data) => { if (data) seen.push(data); });
    const off2 = CacheStore.subscribe("items", (data) => { if (data) seen.push(data); });
    await CacheStore.fetch("items", async () => [1, 2]);
    assert.deepEqual(seen, [[1, 2], [1, 2]]);
    assert.equal(Array.isArray(CacheStore.get("items")), true);
    off1(); off2();
});
