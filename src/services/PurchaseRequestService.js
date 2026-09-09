import ApiClient from "./ApiClient";
import { readList, readDetail } from "./CachedResource";

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

    async getAll(options = {}) {
        return readList(CACHE_KEY, "/purchase-requests", options, (row) => this.normalize(row), "purchase_request_id");
    }

    async getById(id, options = {}) {
        return readDetail(`purchase-requests:${id}`, `/purchase-requests/${id}`, options, (row) => this.normalize(row));
    }

    async create(payload) {
        const result = await ApiClient.post(
            "/purchase-requests",
            payload
        );

        return result;
    }

    async addDetail(id, payload) {
        const result = await ApiClient.post(
            `/purchase-requests/${id}/details`,
            payload
        );

        return result;
    }

    async updateDetail(id, detailId, payload) {
        const result = await ApiClient.patch(
            `/purchase-requests/${id}/details/${detailId}`,
            payload
        );

        return result;
    }

    async deleteDetail(id, detailId) {
        const result = await ApiClient.delete(
            `/purchase-requests/${id}/details/${detailId}`
        );

        return result;
    }
}

export default new PurchaseRequestService();
