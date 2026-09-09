import ApiClient from "./ApiClient";
import { readList, readDetail } from "./CachedResource";

const CACHE_KEY = "users";

class UserService {
  normalize(user) {
    return {
      ...user,
      id: user.id,
    };
  }

    async getAll(options = {}) {
        return readList(CACHE_KEY, "/users", options, (row) => this.normalize(row));
    }

    async getById(id, options = {}) {
        return readDetail(`users:${id}`, `/users/${id}`, options, (row) => this.normalize(row));
    }

  async create(payload) {
    const result = await ApiClient.post(
      "/users",
      payload
    );

    return result;
  }

  async update(id, payload) {
    const result = await ApiClient.put(
      `/users/${id}`,
      payload
    );

    return result;
  }

  async delete(id) {
    const result = await ApiClient.delete(
      `/users/${id}`
    );

    return result;
  }
}

export default new UserService();
