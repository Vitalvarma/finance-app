import { create } from "zustand";
import api from "../api/axios";

const useTransactionStore = create((set, get) => ({
  transactions: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
  filters: { type: "", category: "", startDate: "", endDate: "" },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters }, page: 1 }),
  setPage: (page) => set({ page }),

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, page } = get();
      const params = { page, limit: 10, ...filters };
      // Remove empty keys
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get("/transactions", { params });
      set({ transactions: data.transactions, total: data.total, pages: data.pages, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to load transactions.", loading: false });
    }
  },

  createTransaction: async (payload) => {
    try {
      const { data } = await api.post("/transactions", payload);
      await get().fetchTransactions();
      return { success: true, transaction: data.transaction };
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? errors.map((e) => e.message).join(", ") : err.response?.data?.message || "Failed to create.";
      return { success: false, message: msg };
    }
  },

  updateTransaction: async (id, payload) => {
    try {
      const { data } = await api.put(`/transactions/${id}`, payload);
      await get().fetchTransactions();
      return { success: true, transaction: data.transaction };
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? errors.map((e) => e.message).join(", ") : err.response?.data?.message || "Failed to update.";
      return { success: false, message: msg };
    }
  },

  deleteTransaction: async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      await get().fetchTransactions();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to delete." };
    }
  },
}));

export default useTransactionStore;
