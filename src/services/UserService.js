import ApiClient from "./ApiClient";

class UserService {
  normalize(user) {
    return {
      ...user,
      id: user.id,
    };
  }

  async getAll() {
    const response = await ApiClient.get("/users");
    const data = response?.data || response;
    return Array.isArray(data) ? data.map((user) => this.normalize(user)) : [];
  }

  async getById(id) {
    const response = await ApiClient.get(`/users/${id}`);
    const data = response?.data || response;
    return this.normalize(data);
  }

  async create(payload) {
    return ApiClient.post("/users", payload);
  }

  async update(id, payload) {
    return ApiClient.put(`/users/${id}`, payload);
  }

  async delete(id) {
    return ApiClient.delete(`/users/${id}`);
  }
}

export default new UserService();
