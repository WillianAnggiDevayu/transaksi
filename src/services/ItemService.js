import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";
import CacheStore from "./CacheStore";

const CACHE_KEY = "items";

class ItemService {
  normalize(item) {
    return {
      ...item,
      id: item.item_id,
      nama: item.item_name,
      stok: item.stock,
      unit_id: item.unit_id,
      unit: item.unit || null,
    };
  }

  async getAll() {
    if (CacheStore.has(CACHE_KEY)) {
      return CacheStore.get(CACHE_KEY);
    }

    let rawItems = [];

    try {
      const response = await ApiClient.get("/items");
      const data = response?.data || response;

      rawItems = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Gagal memuat items:", err.message);
    }

    const items = rawItems.map((item) => this.normalize(item));

    const result = OfflineQueue.mergeOptimistic(
      "items",
      "item_id",
      items,
      (raw) => this.normalize(raw)
    );

    CacheStore.set(CACHE_KEY, result);

    return result;
  }

  async getById(id) {
    const response = await ApiClient.get(`/items/${id}`);
    const data = response?.data || response;

    return this.normalize(data);
  }

  async create(payload) {
    const result = await ApiClient.post("/items", {
      item_name: payload.item_name,
      stock: payload.stock,
      unit_id: payload.unit_id,
    });

    CacheStore.clear(CACHE_KEY);

    return result;
  }

  async update(id, payload) {
    const result = await ApiClient.put(`/items/${id}`, {
      item_name: payload.item_name,
      stock: payload.stock,
      unit_id: payload.unit_id,
    });

    CacheStore.clear(CACHE_KEY);

    return result;
  }

  async delete(id) {
    const result = await ApiClient.delete(`/items/${id}`);

    CacheStore.clear(CACHE_KEY);

    return result;
  }
}

export default new ItemService();