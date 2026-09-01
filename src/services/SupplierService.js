import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";
import CacheStore from "./CacheStore";

const CACHE_KEY = "suppliers";

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

    return Array.isArray(data)
      ? data.map((item) => this.normalize(item))
      : [];
  }

  async getById(id) {
    const response = await ApiClient.get(`/suppliers/${id}`);
    const data = response?.data || response;

    return this.normalize(data);
  }

  async create(payload) {
    const result = await ApiClient.post(
      "/suppliers",
      payload
    );

    CacheStore.clear(CACHE_KEY);

    return result;
  }

  async update(id, payload) {
    const result = await ApiClient.put(
      `/suppliers/${id}`,
      payload
    );

    CacheStore.clear(CACHE_KEY);

    return result;
  }

  async delete(id) {
    const result = await ApiClient.delete(
      `/suppliers/${id}`
    );

    CacheStore.clear(CACHE_KEY);

    return result;
  }
}

export default new SupplierService();