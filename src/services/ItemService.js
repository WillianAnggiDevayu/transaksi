import ApiClient from "./ApiClient";

class ItemService {
  normalize(item) {
    return {
      ...item,
      id: item.item_id,
      nama: item.item_name,
      stok: item.stock,
      harga: item.item_price,
    };
  }
  async getAll() {
    const response = await ApiClient.get("/items");
    const data = response?.data || response;
    return Array.isArray(data) ? data.map((item) => this.normalize(item)) : [];
  }
  async getById(id) { return ApiClient.get(`/items/${id}`); }
  async create(payload) { return ApiClient.post("/items", payload); }
  async update(id, payload) { return ApiClient.put(`/items/${id}`, payload); }
  async delete(id) { return ApiClient.delete(`/items/${id}`); }
}
export default new ItemService();
