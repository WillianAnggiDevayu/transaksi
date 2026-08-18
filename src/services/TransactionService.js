import ApiClient from "./ApiClient";

class TransactionService {
  normalize(transaction) {
    const details =
      transaction.details ||
      transaction.mstransactionsDetailTransactions ||
      transaction.data?.details ||
      transaction.data?.mstransactionsDetailTransactions ||
      [];

    const total = details.reduce(
      (sum, detail) => sum + Number(detail.subtotal || 0),
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
    const response = await ApiClient.get("/transactions");

    const data = response?.data || response;

    return Array.isArray(data)
      ? data.map((item) => this.normalize(item))
      : [];
  }

  async getById(id) {
    const response = await ApiClient.get(`/transactions/${id}`);

    const data = response?.data || response;

    return this.normalize(data);
  }

  async create(payload) {
    const response = await ApiClient.post(
      "/transactions",
      payload
    );

    const data = response?.data || response;

    return this.normalize(data);
  }

  async update(id, payload) {
    const response = await ApiClient.put(
      `/transactions/${id}`,
      payload
    );

    const data = response?.data || response;

    return this.normalize(data);
  }

  async complete(id) {
    const response = await ApiClient.patch(
      `/transactions/${id}/complete`
    );

    const data = response?.data || response;

    return this.normalize(data);
  }

  async cancel(id) {
    const response = await ApiClient.patch(
      `/transactions/${id}/cancel`
    );

    const data = response?.data || response;

    return this.normalize(data);
  }

  async delete(id) {
    return ApiClient.delete(`/transactions/${id}`);
  }
}

export default new TransactionService();