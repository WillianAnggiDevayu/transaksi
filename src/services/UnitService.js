import ApiClient from "./ApiClient";
import { readList, readDetail } from "./CachedResource";

const CACHE_KEY = "units";

class UnitService {
    async getAll(options = {}) {
        return readList(CACHE_KEY, "/units", options);
    }

    async getById(id, options = {}) {
        return readDetail(`units:${id}`, `/units/${id}`, options);
    }

    async create(payload) {
        const result = await ApiClient.post(
            "/units",
            payload
        );

        return result;
    }

    async update(id, payload) {
        const result = await ApiClient.put(
            `/units/${id}`,
            payload
        );

        return result;
    }

    async delete(id) {
        const result = await ApiClient.delete(
            `/units/${id}`
        );

        return result;
    }
}

export default new UnitService();
