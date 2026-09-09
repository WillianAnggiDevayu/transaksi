import ApiClient from "./ApiClient";
import { readList, readDetail } from "./CachedResource";

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

    async getAll(options = {}) {
        return readList(CACHE_KEY, "/suppliers", options, (row) => this.normalize(row), "supplier_id");
    }

    async getById(id, options = {}) {
        return readDetail(`suppliers:${id}`, `/suppliers/${id}`, options, (row) => this.normalize(row));
    }

  async create(payload) {
    const result = await ApiClient.post(
      "/suppliers",
      payload
    );

    return result;
  }

  async update(id, payload) {
    const result = await ApiClient.put(
      `/suppliers/${id}`,
      payload
    );

    return result;
  }

  async delete(id) {
    const result = await ApiClient.delete(
      `/suppliers/${id}`
    );

    return result;
  }
}

export default new SupplierService();
