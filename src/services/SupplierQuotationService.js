import ApiClient from "./ApiClient";
import CacheStore from "./CacheStore";

const CACHE_KEY = "supplier-quotations";

class SupplierQuotationService {
    async getAll() {
        if (CacheStore.has(CACHE_KEY)) {
            return CacheStore.get(CACHE_KEY);
        }

        const response = await ApiClient.get(
            "/supplier-quotations"
        );

        const result = response?.data || response;
        const data = Array.isArray(result) ? result : [];

        CacheStore.set(CACHE_KEY, data);

        return data;
    }

    async getRequestDetail(requestSupplierId) {
        const response = await ApiClient.get(
            `/supplier-quotations/request-suppliers/${requestSupplierId}`
        );

        return response?.data || response;
    }

    async create(requestSupplierId, payload) {
        const result = await ApiClient.post(
            `/supplier-quotations/request-suppliers/${requestSupplierId}`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async updateHeader(quotationId, payload) {
        const result = await ApiClient.patch(
            `/supplier-quotations/${quotationId}`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }

    async updateDetail(
        quotationId,
        detailId,
        payload
    ) {
        const result = await ApiClient.patch(
            `/supplier-quotations/${quotationId}/details/${detailId}`,
            payload
        );

        CacheStore.clear(CACHE_KEY);

        return result;
    }
}

export default new SupplierQuotationService();