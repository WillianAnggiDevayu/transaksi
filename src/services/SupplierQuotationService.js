import ApiClient from "./ApiClient";
import { readList, readDetail } from "./CachedResource";

const CACHE_KEY = "supplier-quotations";

class SupplierQuotationService {
    async getAll(options = {}) {
        return readList(CACHE_KEY, "/supplier-quotations", options);
    }

    async getRequestDetail(id, options = {}) {
        return readDetail(`supplier-request:${id}`, `/supplier-quotations/request-suppliers/${id}`, options);
    }

    async create(requestSupplierId, payload) {
        const result = await ApiClient.post(
            `/supplier-quotations/request-suppliers/${requestSupplierId}`,
            payload
        );

        return result;
    }

    async addDetail(quotationId, payload) {
        return ApiClient.post("/supplier-quotations/" + quotationId + "/details", payload);
    }

    async deleteDetail(quotationId, detailId) {
        return ApiClient.delete("/supplier-quotations/" + quotationId + "/details/" + detailId);
    }

    async updateHeader(quotationId, payload) {
        const result = await ApiClient.patch(
            `/supplier-quotations/${quotationId}`,
            payload
        );

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

        return result;
    }
}

export default new SupplierQuotationService();
