import ApiClient from "./ApiClient";

class RequestSupplierService {
    async getByPurchaseRequest(purchaseRequestId) {
        const response = await ApiClient.get(
            `/purchase-requests/${purchaseRequestId}/request-suppliers`
        );

        return response?.data || response;
    }

    async createMultiple(purchaseRequestId, payload) {
        return ApiClient.post(
            `/purchase-requests/${purchaseRequestId}/request-suppliers`,
            payload
        );
    }

    async respond(requestSupplierId, payload) {
        return ApiClient.patch(
            `/request-suppliers/${requestSupplierId}/respond`,
            payload
        );
    }
}

export default new RequestSupplierService();