import ApiClient from "./ApiClient";
import AuthService from "./AuthService";
import { isOwner } from "../utils/procurement";

const visible = rows => { const user = AuthService.getUser(); return user?.role === "supplier" ? rows.filter(po => isOwner(po, user)) : rows; };
import CacheStore from "./CacheStore";

const CACHE_KEY = "purchase-orders";

class PurchaseOrderService {
    async getAll() {
        if (CacheStore.has(CACHE_KEY)) {
            return visible(CacheStore.get(CACHE_KEY));
        }

        const response = await ApiClient.get(
            "/purchase-orders"
        );

        const result = response?.data || response;
        const data = Array.isArray(result) ? result : [];

        CacheStore.set(CACHE_KEY, data);

        return visible(data);
    }

    async getById(id) {
        const response = await ApiClient.get(
            `/purchase-orders/${id}`
        );

        const po = response?.data || response;
        const user = AuthService.getUser();
        if (user?.role === "supplier" && !isOwner(po, user)) throw new Error("PO ini bukan milik akun supplier Anda.");
        return po;
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

    async updateDeliveryEstimate(id, payload) {
        return ApiClient.patch("/purchase-orders/" + id + "/delivery-estimate", { expected_delivery_date: payload.expected_delivery_date });
    }

    async updateStatus(id, status, dates = {}) {
        const result = await ApiClient.patch(
            `/purchase-orders/${id}/status`,
            { ...dates, status }
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }
}

export default new PurchaseOrderService();
