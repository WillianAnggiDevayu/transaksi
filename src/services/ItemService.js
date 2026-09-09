import ApiClient from "./ApiClient";
import { readList, readDetail } from "./CachedResource";

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

    async getAll(options = {}) {
        return readList(CACHE_KEY, "/items", options, (row) => this.normalize(row), "item_id");
    }

    async getById(id, options = {}) {
        return readDetail(`items:${id}`, `/items/${id}`, options, (row) => this.normalize(row));
    }

  async create(payload) {
    const result = await ApiClient.post("/items", {
      item_name: payload.item_name,
      stock: payload.stock,
      unit_id: payload.unit_id,
    });

    return result;
  }

  async update(id, payload) {
    const result = await ApiClient.put(`/items/${id}`, {
      item_name: payload.item_name,
      stock: payload.stock,
      unit_id: payload.unit_id,
    });

    return result;
  }

  async delete(id) {
    const result = await ApiClient.delete(`/items/${id}`);

    return result;
  }
}

export default new ItemService();
