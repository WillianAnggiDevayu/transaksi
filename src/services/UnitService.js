import ApiClient from "./ApiClient";
import CacheStore from "./CacheStore";

const CACHE_KEY = "units";

class UnitService {
    async getAll() {
        if (CacheStore.has(CACHE_KEY)) {
            return CacheStore.get(CACHE_KEY);
        }

        const response = await ApiClient.get("/units");
        const result = response?.data || response;

        const data = Array.isArray(result) ? result : [];

        CacheStore.set(CACHE_KEY, data);

        return data;
    }

    async getById(id) {
        const response = await ApiClient.get(`/units/${id}`);

        return response?.data || response;
    }

    async create(payload) {
        const result = await ApiClient.post(
            "/units",
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async update(id, payload) {
        const result = await ApiClient.put(
            `/units/${id}`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async delete(id) {
        const result = await ApiClient.delete(
            `/units/${id}`
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }
}

export default new UnitService();