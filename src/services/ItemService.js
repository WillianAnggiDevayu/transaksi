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
      unit_id: item.unit_id,
      unit: item.unit || null,
    };
  }

  async getAll() {
    let rawItems = [];

    try {
      const response = await ApiClient.get("/items");
      const data = response?.data || response;

      rawItems = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Gagal memuat data barang:", err.message);
    }

    const items = rawItems.map((item) => this.normalize(item));

    return OfflineQueue.mergeOptimistic(
      "items",
      "item_id",
      items,
      (raw) => this.normalize(raw)
    );
  }

  async getById(id) {
    const response = await ApiClient.get(`/items/${id}`);
    const data = response?.data || response;

    return this.normalize(data);
  }

  async create(payload) {
    return ApiClient.post("/items", {
      item_name: payload.item_name,
      item_price: payload.item_price,
      unit_id: payload.unit_id,
    });
  }

  async update(id, payload) {
    return ApiClient.put(`/items/${id}`, {
      item_name: payload.item_name,
      item_price: payload.item_price,
      unit_id: payload.unit_id,
    });
  }

  async delete(id) {
    return ApiClient.delete(`/items/${id}`);
  }
}

export default new ItemService();