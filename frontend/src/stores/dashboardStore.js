import { create } from "zustand";
import api from "../api/axios";

const useDashboardStore = create((set) => ({
  summary: null,
  trends: [],
  categoryBreakdown: [],
  recentActivity: [],
  loading: false,
  error: null,

  fetchSummary: async (params = {}) => {
    try {
      const { data } = await api.get("/dashboard/summary", { params });
      set({ summary: data.summary });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to load summary." });
    }
  },

  fetchTrends: async (months = 6) => {
    try {
      const { data } = await api.get("/dashboard/trends", { params: { months } });
      set({ trends: data.trends });
    } catch {
      // silently fail — not all roles have access
    }
  },

  fetchCategoryBreakdown: async (params = {}) => {
    try {
      const { data } = await api.get("/dashboard/category-breakdown", { params });
      set({ categoryBreakdown: data.breakdown });
    } catch {
      // silently fail — not all roles have access
    }
  },

  fetchRecentActivity: async (limit = 8) => {
    try {
      const { data } = await api.get("/dashboard/recent", { params: { limit } });
      set({ recentActivity: data.transactions });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to load activity." });
    }
  },

  fetchAll: async (role) => {
    set({ loading: true });
    const promises = [
      useDashboardStore.getState().fetchSummary(),
      useDashboardStore.getState().fetchRecentActivity(),
    ];
    if (role === "analyst" || role === "admin") {
      promises.push(useDashboardStore.getState().fetchTrends());
      promises.push(useDashboardStore.getState().fetchCategoryBreakdown());
    }
    await Promise.all(promises);
    set({ loading: false });
  },
}));

export default useDashboardStore;
