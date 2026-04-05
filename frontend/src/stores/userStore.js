import { create } from "zustand";
import api from "../api/axios";

const useUserStore = create((set, get) => ({
  users: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,

  setPage: (page) => set({ page }),

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const { page } = get();
      const { data } = await api.get("/users", { params: { page, limit: 10 } });
      set({ users: data.users, total: data.total, pages: data.pages, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to load users.", loading: false });
    }
  },

  createUser: async (payload) => {
    try {
      await api.post("/users", payload);
      await get().fetchUsers();
      return { success: true };
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? errors.map((e) => e.message).join(", ") : err.response?.data?.message || "Failed to create user.";
      return { success: false, message: msg };
    }
  },

  updateUser: async (id, payload) => {
    try {
      await api.patch(`/users/${id}`, payload);
      await get().fetchUsers();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to update user." };
    }
  },

  deleteUser: async (id) => {
    try {
      await api.delete(`/users/${id}`);
      await get().fetchUsers();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to delete user." };
    }
  },
}));

export default useUserStore;
