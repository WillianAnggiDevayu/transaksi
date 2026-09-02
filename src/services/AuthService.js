import ApiClient from "./ApiClient";
import CacheStore from "./CacheStore";

class AuthService {
  async login(email, password) {
    const response = await ApiClient.post("/login", { email, password });
    const token = response?.token || response?.data?.token;
    if (!token) throw new Error("Token tidak ditemukan pada response login.");

    CacheStore.clearAll();

    localStorage.setItem("token", token);

    let user = response?.user || response?.data?.user;
    if (!user) user = await this.currentUser();
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  }

  async currentUser() {
    const response = await ApiClient.get("/user");
    return response?.data || response?.user || response;
  }

  async logout() {
    try { await ApiClient.post("/logout", {}); } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      CacheStore.clearAll();
    }
  }

  getUser() {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  }

  isAuthenticated() { return Boolean(localStorage.getItem("token")); }
}

export default new AuthService();