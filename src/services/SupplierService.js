import ApiClient from "./ApiClient";

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
    const response = await ApiClient.get("/suppliers");
    const data = response?.data || response;
    return Array.isArray(data) ? data.map((item) => this.normalize(item)) : [];
  }
  async getById(id) { return ApiClient.get(`/suppliers/${id}`); }
  async create(payload) { return ApiClient.post("/suppliers", payload); }
  async update(id, payload) { return ApiClient.put(`/suppliers/${id}`, payload); }
  async delete(id) { return ApiClient.delete(`/suppliers/${id}`); }
}
export default new SupplierService();
