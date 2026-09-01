import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";

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
        let rawItems = [];

        try {
            const response = await ApiClient.get("/purchase-requests");
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

        return OfflineQueue.mergeOptimistic(
            "purchase-requests",
            "purchase_request_id",
            items,
            (raw) => this.normalize(raw)
        );
    }

    async getById(id) {
        const response = await ApiClient.get(
            `/purchase-requests/${id}`
        );

        const data = response?.data || response;

        return this.normalize(data);
    }

    async create(payload) {
        return ApiClient.post("/purchase-requests", payload);
    }

    async addDetail(id, payload) {
        return ApiClient.post(
            `/purchase-requests/${id}/details`,
            payload
        );
    }

    async updateDetail(id, detailId, payload) {
        return ApiClient.patch(
            `/purchase-requests/${id}/details/${detailId}`,
            payload
        );
    }

    async deleteDetail(id, detailId) {
        return ApiClient.delete(
            `/purchase-requests/${id}/details/${detailId}`
        );
    }
}

export default new PurchaseRequestService();