import CacheStore from "./CacheStore";
import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";

export function readList(key, path, options = {}, normalize = (row) => row, idField = null) {
    return CacheStore.read(key, async () => {
        let rows;
        try {
            const response = await ApiClient.get(path);
            const raw = response?.data ?? response;
            if (!Array.isArray(raw)) throw new Error("Format daftar tidak valid: " + key);
            rows = raw.map(normalize);
        } catch (error) {
            if (!error?.status && idField) {
                const previous = CacheStore.get(key);
                const base = Array.isArray(previous) ? previous.filter((row) => row._pendingAction !== "create") : [];
                const optimistic = await OfflineQueue.mergeOptimistic(key, idField, base, normalize);
                if (Array.isArray(previous) || optimistic.length) error.cachedData = optimistic;
            }
            throw error;
        }
        return idField ? await OfflineQueue.mergeOptimistic(key, idField, rows, normalize) : rows;
    }, options);
}

export function readDetail(key, path, options = {}, normalize = (row) => row) {
    return CacheStore.read(key, async () => {
        const response = await ApiClient.get(path);
        const row = response?.data ?? response;
        if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("Detail tidak tersedia.");
        return normalize(row);
    }, options);
}
