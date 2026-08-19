import ApiClient from "./ApiClient";
import OfflineQueue from "./OfflineQueue";

class TransactionService {
  normalize(transaction) {
    const details =
      transaction.details ||
      transaction.mstransactionsDetailTransactions ||
      transaction.data?.details ||
      transaction.data?.mstransactionsDetailTransactions ||
      [];

    // Untuk transaksi yang masih tertunda (offline), field `subtotal`
    // belum dihitung server, jadi fallback ke item_quant * item_price.
    const total = details.reduce(
      (sum, detail) =>
        sum +
        Number(
          detail.subtotal ??
          Number(detail.item_quant || 0) * Number(detail.item_price || 0)
        ),
      0
    );

    return {
      ...transaction,

      id: transaction.tr_id,

      tanggal: transaction.tr_date,

      supplier:
        transaction.mstransactionsSuppliers?.supplier_name ||
        transaction.supplier?.supplier_name ||
        transaction.supplier_name ||
        transaction.supplier_id,

      payment_method: transaction.payment_method,

      status: transaction.status,

      total: Number(transaction.total ?? total),

      details,
    };
  }

  async getAll() {
    let rawItems = [];

    try {
      const response = await ApiClient.get("/transactions");
      const data = response?.data || response;
      rawItems = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Gagal memuat data transaksi:", err.message);
    }

    const items = rawItems.map((item) => this.normalize(item));

    return OfflineQueue.mergeOptimistic("transactions", "tr_id", items, (raw) =>
      this.normalize(raw)
    );
  }

  async getById(id) {
    const response = await ApiClient.get(`/transactions/${id}`);
    const data = response?.data || response;
    return this.normalize(data);
  }

  async create(payload) {
    const response = await ApiClient.post("/transactions", payload);
    const data = response?.data || response;
    return this.normalize(data);
  }

  async update(id, payload) {
    const response = await ApiClient.put(`/transactions/${id}`, payload);
    const data = response?.data || response;
    return this.normalize(data);
  }

  async complete(id) {
    const response = await ApiClient.patch(`/transactions/${id}/complete`);
    const data = response?.data || response;
    return this.normalize(data);
  }

  async cancel(id) {
    const response = await ApiClient.patch(`/transactions/${id}/cancel`);
    const data = response?.data || response;
    return this.normalize(data);
  }

  async delete(id) {
    return ApiClient.delete(`/transactions/${id}`);
  }
}

export default new TransactionService();
