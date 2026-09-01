import ApiClient from "./ApiClient";

class PaymentService {
    async getByPurchaseOrder(purchaseOrderId) {
        const response = await ApiClient.get(
            `/purchase-orders/${purchaseOrderId}/payments`
        );

        return response?.data || response;
    }

    async getById(id) {
        const response = await ApiClient.get(
            `/payments/${id}`
        );

        return response?.data || response;
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