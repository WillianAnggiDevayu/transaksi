import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";

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
    let rawItems = [];

    try {
      const response = await ApiClient.get("/items");
      const data = response?.data || response;
      rawItems = Array.isArray(data) ? data : [];
    } catch (err) {
      // Tidak ada koneksi & tidak ada cache dari service worker.
      console.warn("Gagal memuat data barang:", err.message);
    }

    const items = rawItems.map((item) => this.normalize(item));

    return OfflineQueue.mergeOptimistic("items", "item_id", items, (raw) =>
      this.normalize(raw)
    );
  }

  async getById(id) { return ApiClient.get(`/items/${id}`); }
  async create(payload) { return ApiClient.post("/items", payload); }
  async update(id, payload) { return ApiClient.put(`/items/${id}`, payload); }
  async delete(id) { return ApiClient.delete(`/items/${id}`); }
}
export default new ItemService();
