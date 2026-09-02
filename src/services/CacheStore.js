const store = new Map();
const listeners = new Map();

function getListeners(key) {
    if (!listeners.has(key)) {
        listeners.set(key, new Set());
    }

    return listeners.get(key);
}

function notify(key, value) {
    getListeners(key).forEach((callback) => callback(value));
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
        notify(key, value);
    },

    clear(key) {
        store.delete(key);
        notify(key, undefined);
    },

    clearPrefix(prefix) {
        for (const key of store.keys()) {
            if (!key.startsWith(prefix)) continue;

            store.delete(key);
            notify(key, undefined);
        }
    },

    subscribe(key, callback) {
        const callbacks = getListeners(key);

        callbacks.add(callback);

        return () => {
            callbacks.delete(callback);

            if (callbacks.size === 0) {
                listeners.delete(key);
            }
        };
    },

    clearAll() {
        for (const key of Array.from(store.keys())) {
            this.clear(key);
        }
    },
};

export default CacheStore;