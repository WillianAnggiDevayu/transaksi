import ApiClient from "./ApiClient";
import { readList } from "./CachedResource";

class RequestSupplierService {
    async getByPurchaseRequest(id, options = {}) {
        return readList(`request-suppliers:${id}`, `/purchase-requests/${id}/request-suppliers`, options);
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
