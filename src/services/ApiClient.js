import OfflineQueue from "./OfflineQueue";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://procurement-api.my.id/api";

class ApiClient {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  getToken() {
    return localStorage.getItem("token");
  }

  buildHeaders(options = {}) {
    const token = this.getToken();

    return {
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
  }

  isNetworkError(err) {
    // Kegagalan fetch murni karena tidak ada koneksi (bukan error dari server,
    // yang selalu punya err.status).
    return !err?.status;
  }

  extractEntity(path) {
    return path.split("/").filter(Boolean)[0] || "unknown";
  }

  extractTargetId(path) {
    const parts = path.split("/").filter(Boolean);
    return parts.length > 1 ? decodeURIComponent(parts[1].split("?")[0]) : null;
  }

  async performFetch(path, options, headers) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

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

  /**
   * Menyimpan permintaan yang gagal (karena offline) ke antrian lokal,
   * lalu mengembalikan respons "optimistic" seolah berhasil, supaya
   * kode pemanggil (services/pages) tidak perlu tahu bahwa ini offline.
   */
  async queueMutation(path, options) {
    const method = (options.method || "POST").toUpperCase();
    const payload = options.body ? JSON.parse(options.body) : null;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await OfflineQueue.addToQueue({
      entity: this.extractEntity(path),
      method,
      path,
      payload,
      targetId: this.extractTargetId(path),
      tempId,
    });

    return {
      __offlineQueued: true,
      tempId,
      data: payload,
      message:
        "Perubahan disimpan secara offline dan akan disinkronkan otomatis saat koneksi kembali.",
    };
  }

  async request(path, options = {}) {
    const headers = this.buildHeaders(options);
    const method = (options.method || "GET").toUpperCase();
    const isMutating = method !== "GET";

    // Jika browser sudah tahu sedang offline, langsung antre tanpa
    // menunggu fetch timeout.
    if (isMutating && typeof navigator !== "undefined" && navigator.onLine === false) {
      return this.queueMutation(path, options);
    }

    try {
      return await this.performFetch(path, options, headers);
    } catch (err) {
      if (isMutating && this.isNetworkError(err)) {
        return this.queueMutation(path, options);
      }
      throw err;
    }
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

  /**
   * Mengirim ulang semua permintaan yang tertunda di antrian offline,
   * berurutan sesuai waktu dibuat. Dipanggil otomatis saat koneksi
   * kembali online (lihat useOnlineStatus).
   */
  async syncPendingQueue() {
    const queue = await OfflineQueue.getQueue();

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const headers = this.buildHeaders({
          body: item.payload ? JSON.stringify(item.payload) : undefined,
        });

        await this.performFetch(
          item.path,
          {
            method: item.method,
            body: item.payload ? JSON.stringify(item.payload) : undefined,
          },
          headers
        );

        await OfflineQueue.removeFromQueue(item.id);
        synced++;
      } catch (err) {
        if (err?.status) {
          // Ditolak server (mis. validasi gagal / data sudah tidak ada).
          // Tidak ada gunanya diulang otomatis, buang dari antrian.
          console.error("Sinkronisasi ditolak server, dihapus dari antrian:", item, err.message);
          await OfflineQueue.removeFromQueue(item.id);
          failed++;
          continue;
        }

        // Masih offline / koneksi terputus -> hentikan, sisanya dicoba lagi nanti.
        break;
      }
    }

    window.dispatchEvent(
      new CustomEvent("pms-sync-complete", { detail: { synced, failed } })
    );

    return { synced, failed };
  }
}

const apiClient = new ApiClient();

export default apiClient;

export {
  API_URL,
  ApiClient,
};