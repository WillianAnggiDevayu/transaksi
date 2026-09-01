import ApiClient from "./ApiClient";

class SupplierQuotationService {
    async getAll() {
        const response = await ApiClient.get(
            "/supplier-quotations"
        );

        return response?.data || response;
    }

    async getRequestDetail(requestSupplierId) {
        const response = await ApiClient.get(
            `/supplier-quotations/request-suppliers/${requestSupplierId}`
        );

        return response?.data || response;
    }

    async create(requestSupplierId, payload) {
        return ApiClient.post(
            `/supplier-quotations/request-suppliers/${requestSupplierId}`,
            payload
        );
    }

    async updateHeader(quotationId, payload) {
        return ApiClient.patch(
            `/supplier-quotations/${quotationId}`,
            payload
        );
    }

    async updateDetail(
        quotationId,
        detailId,
        payload
    ) {
        return ApiClient.patch(
            `/supplier-quotations/${quotationId}/details/${detailId}`,
            payload
        );
    }
}

export default new SupplierQuotationService();