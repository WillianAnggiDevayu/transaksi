import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";

class SupplierService {
  normalize(item) {
    return {
      ...item,
      id: item.supplier_id,
      nama: item.supplier_name,
      telepon: item.phone,
    };
  }

  async getAll() {
    let rawItems = [];

    try {
      const response = await ApiClient.get("/suppliers");
      const data = response?.data || response;
      rawItems = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Gagal memuat data supplier:", err.message);
    }

    const items = rawItems.map((item) => this.normalize(item));

    return OfflineQueue.mergeOptimistic("suppliers", "supplier_id", items, (raw) =>
      this.normalize(raw)
    );
  }

  async getById(id) { return ApiClient.get(`/suppliers/${id}`); }
  async create(payload) { return ApiClient.post("/suppliers", payload); }
  async update(id, payload) { return ApiClient.put(`/suppliers/${id}`, payload); }
  async delete(id) { return ApiClient.delete(`/suppliers/${id}`); }
}
export default new SupplierService();
