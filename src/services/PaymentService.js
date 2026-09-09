import ApiClient from "./ApiClient";
import CacheStore from "./CacheStore";
import { readDetail, readList } from "./CachedResource";

class PaymentService {
    async getByPurchaseOrderWithSummary(purchaseOrderId, options = {}) {
        return CacheStore.read(`payment-summary:${purchaseOrderId}`, async () => {
        const response = await ApiClient.get(`/purchase-orders/${purchaseOrderId}/payments`);
        const summary = response?.meta?.payment_summary;
        if (!Array.isArray(response?.data) || !summary ||
            !["total_amount", "confirmed_amount", "remaining_amount"].every((key) =>
                typeof summary[key] === "string" && /^-?\d+\.\d{2}$/.test(summary[key]))) {
            throw new Error("Ringkasan pembayaran belum tersedia. Muat ulang setelah backend diperbarui.");
        }
        return { payments: response.data, summary };
        }, options);
    }

    async getOverview(orderIds, options = {}) {
        const ids = [...new Set(orderIds)].sort();
        return CacheStore.read("payment-overview:" + JSON.stringify(ids), async () => {
            return Promise.all(ids.map(async (id) => ({
                purchase_order_id: id,
                ...await this.getByPurchaseOrderWithSummary(id, { force: options.force }),
            })));
        }, options);
    }

    async delete(id) {
        return ApiClient.delete(`/payments/${id}`);
    }
    async getByPurchaseOrder(id, options = {}) {
        return readList(`payments:${id}`, `/purchase-orders/${id}/payments`, options);
    }

    async getById(id, options = {}) {
        return readDetail(`payment:${id}`, `/payments/${id}`, options);
    }

    async create(purchaseOrderId, payload) {
        return ApiClient.post(
            `/purchase-orders/${purchaseOrderId}/payments`,
            payload
        );
    }

    async update(id, payload) {
        return ApiClient.patch(
            `/payments/${id}`,
            payload
        );
    }

    async submit(id) {
        return ApiClient.patch(
            `/payments/${id}/submit`
        );
    }

    async confirm(id) {
        return ApiClient.patch(
            `/payments/${id}/confirm`
        );
    }

    async reject(id) {
        return ApiClient.patch(
            `/payments/${id}/reject`
        );
    }
}

export default new PaymentService();
