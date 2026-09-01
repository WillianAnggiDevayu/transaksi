// src/services/CacheStore.js
const store = new Map();
const listeners = new Map();

function getListeners(key) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    return listeners.get(key);
}

const CacheStore = {
    get(key) {
        return store.get(key);
    },
    has(key) {
        return store.has(key);
    },
    set(key, value) {
        store.set(key, value);
        getListeners(key).forEach((cb) => cb(value));
    },
    clear(key) {
        store.delete(key);
    },
    clearPrefix(prefix) {
        for (const k of store.keys()) {
            if (k.startsWith(prefix)) store.delete(k);
        }
    },
    subscribe(key, cb) {
        getListeners(key).add(cb);
        return () => getListeners(key).delete(cb);
    },
};

export default CacheStore;