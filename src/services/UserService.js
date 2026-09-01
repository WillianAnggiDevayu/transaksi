import ApiClient from "./ApiClient";
import CacheStore from "./CacheStore";

const CACHE_KEY = "users";

class UserService {
  normalize(user) {
    return {
      ...user,
      id: user.id,
    };
  }

  async getAll() {
    if (CacheStore.has(CACHE_KEY)) {
      return CacheStore.get(CACHE_KEY);
    }

    const response = await ApiClient.get("/users");
    const data = response?.data || response;

    const result = Array.isArray(data)
      ? data.map((user) => this.normalize(user))
      : [];

    CacheStore.set(CACHE_KEY, result);

    return result;
  }

  async getById(id) {
    const response = await ApiClient.get(`/users/${id}`);
    const data = response?.data || response;

    return this.normalize(data);
  }

  async create(payload) {
    const result = await ApiClient.post(
      "/users",
      payload
    );

    CacheStore.clear(CACHE_KEY);

    return result;
  }

  async update(id, payload) {
    const result = await ApiClient.put(
      `/users/${id}`,
      payload
    );

    CacheStore.clear(CACHE_KEY);

    return result;
  }

  async delete(id) {
    const result = await ApiClient.delete(
      `/users/${id}`
    );

    CacheStore.clear(CACHE_KEY);

    return result;
  }
}

export default new UserService();