const API_URL =
  import.meta.env.VITE_API_URL ||
  "VITE_API_URL=https://blustery-fedora-entitle.ngrok-free.dev/api";

class ApiClient {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  getToken() {
    return localStorage.getItem("token");
  }

  async request(path, options = {}) {
    const token = this.getToken();

    const headers = {
      Accept: "application/json",

      ...(options.body
        ? {
          "Content-Type": "application/json",
        }
        : {}),

      ...(token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {}),

      ...(options.headers || {}),
    };

    const response = await fetch(
      `${this.baseUrl}${path}`,
      {
        ...options,
        headers,
      }
    );

    const text = await response.text();

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      const errors = data?.errors;

      const message =
        data?.message ||
        (errors
          ? JSON.stringify(errors)
          : `Request gagal (${response.status})`);

      const error = new Error(message);

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  get(path) {
    return this.request(path);
  }

  post(path, body) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(path, body) {
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  patch(path, body) {
    return this.request(path, {
      method: "PATCH",
      ...(body !== undefined
        ? {
          body: JSON.stringify(body),
        }
        : {}),
    });
  }

  delete(path) {
    return this.request(path, {
      method: "DELETE",
    });
  }
}

export default new ApiClient();

export {
  API_URL,
  ApiClient,
};