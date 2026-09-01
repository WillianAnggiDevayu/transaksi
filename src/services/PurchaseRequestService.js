import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";
import CacheStore from "./CacheStore";

const CACHE_KEY = "purchase-requests";

class PurchaseRequestService {
    normalize(item) {
        return {
            ...item,
            id: item.purchase_request_id,
            nomor: item.request_number,
            tanggal: item.request_date,
            status: item.status,
            catatan: item.notes,
            details:
                item.purchase_request_detail_purchase_request || [],
        };
    }

    async getAll() {
        if (CacheStore.has(CACHE_KEY)) {
            return CacheStore.get(CACHE_KEY);
        }

        let rawItems = [];

        try {
            const response = await ApiClient.get(
                "/purchase-requests"
            );

            const data = response?.data || response;

            rawItems = Array.isArray(data) ? data : [];
        } catch (err) {
            console.warn(
                "Gagal memuat purchase request:",
                err.message
            );
        }

        const items = rawItems.map((item) =>
            this.normalize(item)
        );

        const result = OfflineQueue.mergeOptimistic(
            "purchase-requests",
            "purchase_request_id",
            items,
            (raw) => this.normalize(raw)
        );

        CacheStore.set(CACHE_KEY, result);

        return result;
    }

    async getById(id) {
        const response = await ApiClient.get(
            `/purchase-requests/${id}`
        );

        const data = response?.data || response;

        return this.normalize(data);
    }

    async create(payload) {
        const result = await ApiClient.post(
            "/purchase-requests",
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async addDetail(id, payload) {
        const result = await ApiClient.post(
            `/purchase-requests/${id}/details`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async updateDetail(id, detailId, payload) {
        const result = await ApiClient.patch(
            `/purchase-requests/${id}/details/${detailId}`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async deleteDetail(id, detailId) {
        const result = await ApiClient.delete(
            `/purchase-requests/${id}/details/${detailId}`
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }
}

export default new PurchaseRequestService();