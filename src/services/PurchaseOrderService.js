import ApiClient from "./ApiClient";
import CacheStore from "./CacheStore";

const CACHE_KEY = "purchase-orders";

class PurchaseOrderService {
    async getAll() {
        if (CacheStore.has(CACHE_KEY)) {
            return CacheStore.get(CACHE_KEY);
        }

        const response = await ApiClient.get(
            "/purchase-orders"
        );

        const result = response?.data || response;
        const data = Array.isArray(result) ? result : [];

        CacheStore.set(CACHE_KEY, data);

        return data;
    }

    async getById(id) {
        const response = await ApiClient.get(
            `/purchase-orders/${id}`
        );

        return response?.data || response;
    }

    async createFromQuotation(
        supplierQuotationId,
        payload
    ) {
        const result = await ApiClient.post(
            `/supplier-quotations/${supplierQuotationId}/purchase-order`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async update(id, payload) {
        const result = await ApiClient.patch(
            `/purchase-orders/${id}`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async updateStatus(id, status) {
        const result = await ApiClient.patch(
            `/purchase-orders/${id}/status`,
            { status }
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }
}

export default new PurchaseOrderService();