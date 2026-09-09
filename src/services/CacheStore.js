// All readers of a key share its data, request, error and generation.
const records = new Map();
const listeners = new Map();
const EMPTY = Object.freeze({ data: undefined, loading: false, error: null, stale: true });
let session = 0;

function entry(key) {
    if (!records.has(key)) records.set(key, { snapshot: EMPTY, version: 0, pending: null });
    return records.get(key);
}
function notify(key, event = "update") {
    listeners.get(key)?.forEach((callback) => callback(CacheStore.get(key), event));
}
function publish(key, record, patch) {
    record.snapshot = { ...record.snapshot, ...patch };
    notify(key);
}
function obsolete() {
    const error = new Error("Permintaan cache sudah tidak berlaku.");
    error.name = "AbortError";
    return error;
}

const CacheStore = {
    get: (key) => records.get(key)?.snapshot.data,
    has: (key) => records.get(key)?.snapshot.data !== undefined,
    snapshot: (key) => records.get(key)?.snapshot || EMPTY,
    session: () => session,
    set(key, value) {
        const record = entry(key);
        record.version++;
        record.pending = null;
        publish(key, record, { data: value, loading: false, error: null, stale: false });
        return value;
    },
    // Services can also be used directly; hooks use cache:false to own the request.
    read(key, loader, options = {}) {
        return options.cache === false ? Promise.resolve().then(loader) : this.fetch(key, loader, options);
    },
    fetch(key, loader, { force = false, dedupe = false } = {}) {
        const record = entry(key);
        if (record.pending) return record.pending;
        if ((!force || (dedupe && record.finishedAt && Date.now() - record.finishedAt < 100)) && record.snapshot.data !== undefined && !record.snapshot.stale) {
            return Promise.resolve(record.snapshot.data);
        }
        const version = ++record.version;
        const startedSession = session;
        const valid = () => startedSession === session && records.get(key) === record && record.version === version;
        const request = Promise.resolve().then(() => { if (!valid()) throw obsolete(); return loader(); }).then((data) => {
            if (!valid()) throw obsolete();
            record.pending = null;
            record.finishedAt = Date.now();
            publish(key, record, { data, loading: false, stale: false, error: null });
            return data;
        }).catch((error) => {
            if (!valid()) throw obsolete();
            record.pending = null;
            publish(key, record, {
                loading: false, stale: true, error,
                ...([401, 403].includes(error?.status) ? { data: undefined }
                    : error?.cachedData !== undefined ? { data: error.cachedData } : {}),
            });
            throw error;
        });
        record.pending = request;
        publish(key, record, { loading: true, error: null, stale: true });
        return request;
    },
    invalidate(key) {
        const record = entry(key);
        record.version++;
        record.pending = null;
        record.snapshot = { ...record.snapshot, loading: false, stale: true };
        notify(key, "invalidate");
    },
    invalidateAll() {
        // Invalidate every generation before starting any dependent request.
        const keys = new Set([...records.keys(), ...listeners.keys()]);
        for (const key of keys) {
            const record = entry(key);
            record.version++;
            record.pending = null;
            record.snapshot = { ...record.snapshot, loading: false, stale: true };
        }
        keys.forEach((key) => notify(key, "invalidate"));
    },
    clear(key) { this.invalidate(key); },
    clearPrefix(prefix) {
        new Set([...records.keys(), ...listeners.keys()]).forEach((key) => {
            if (key.startsWith(prefix)) this.invalidate(key);
        });
    },
    subscribe(key, callback) {
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key).add(callback);
        return () => {
            listeners.get(key)?.delete(callback);
            if (!listeners.get(key)?.size) listeners.delete(key);
        };
    },
    clearAll() {
        session++;
        records.clear();
        listeners.forEach((_, key) => notify(key, "reset"));
    },
};
export default CacheStore;
