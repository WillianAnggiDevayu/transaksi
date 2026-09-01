import ApiClient from "./ApiClient";

class UnitService {
    async getAll() {
        const response = await ApiClient.get("/units");
        return response?.data || response;
    }

    async getById(id) {
        const response = await ApiClient.get(`/units/${id}`);
        return response?.data || response;
    }

    async create(payload) {
        return ApiClient.post("/units", payload);
    }

    async update(id, payload) {
        return ApiClient.put(`/units/${id}`, payload);
    }

    async delete(id) {
        return ApiClient.delete(`/units/${id}`);
    }
}

export default new UnitService();