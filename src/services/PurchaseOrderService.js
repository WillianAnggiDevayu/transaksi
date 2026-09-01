import ApiClient from "./ApiClient";

class PurchaseOrderService {
    async getAll() {
        const response = await ApiClient.get(
            "/purchase-orders"
        );

        return response?.data || response;
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
        return ApiClient.post(
            `/supplier-quotations/${supplierQuotationId}/purchase-order`,
            payload
        );
    }

    async update(id, payload) {
        return ApiClient.patch(
            `/purchase-orders/${id}`,
            payload
        );
    }

    async updateStatus(id, status) {
        return ApiClient.patch(
            `/purchase-orders/${id}/status`,
            { status }
        );
    }
}

export default new PurchaseOrderService();