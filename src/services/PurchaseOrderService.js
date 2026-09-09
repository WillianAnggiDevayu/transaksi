import ApiClient from "./ApiClient";
import AuthService from "./AuthService";
import { isOwner } from "../utils/procurement";

const visible = rows => { const user = AuthService.getUser(); return user?.role === "supplier" ? rows.filter(po => isOwner(po, user)) : rows; };
import CacheStore from "./CacheStore";
import { readList, readDetail } from "./CachedResource";

const CACHE_KEY = "purchase-orders";

class PurchaseOrderService {
    async getAll(options = {}) {
        return CacheStore.read(CACHE_KEY, async () => visible(await readList(CACHE_KEY, "/purchase-orders", { cache: false })), options);
    }

    async getById(id, options = {}) {
        return readDetail(`purchase-orders:${id}`, `/purchase-orders/${id}`, options, (po) => {
            const user = AuthService.getUser();
            if (user?.role === "supplier" && !isOwner(po, user)) {
                const error = new Error("PO ini bukan milik akun supplier Anda.");
                error.status = 403;
                throw error;
            }
            return po;
        });
    }

    async createFromQuotation(
        supplierQuotationId,
        payload
    ) {
        const result = await ApiClient.post(
            `/supplier-quotations/${supplierQuotationId}/purchase-order`,
            payload
        );

        return result;
    }

    async update(id, payload) {
        const result = await ApiClient.patch(
            `/purchase-orders/${id}`,
            payload
        );

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

        return result;
    }
}

export default new PurchaseOrderService();
