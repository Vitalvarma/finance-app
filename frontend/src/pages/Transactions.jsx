import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Filter, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import useTransactionStore from "../stores/transactionStore";
import useAuthStore from "../stores/authStore";

const EMPTY_FORM = { amount: "", type: "income", category: "", date: "", notes: "" };

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const TransactionForm = ({ initial, onSubmit, onCancel, loading, error }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={handle}
            placeholder="0.00"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
          <select name="type" value={form.type} onChange={handle} className="input">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
        <input
          name="category"
          required
          value={form.category}
          onChange={handle}
          placeholder="e.g. Salary, Rent, Groceries"
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
        <input
          name="date"
          type="date"
          required
          value={form.date ? form.date.slice(0, 10) : ""}
          onChange={handle}
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handle}
          rows={2}
          placeholder="Optional description…"
          className="input resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Saving…" : "Save Transaction"}
        </button>
      </div>
    </form>
  );
};

const Transactions = () => {
  const { user } = useAuthStore();
  const {
    transactions, total, page, pages, loading, filters,
    fetchTransactions, setFilters, setPage,
    createTransaction, updateTransaction, deleteTransaction,
  } = useTransactionStore();

  const [modal, setModal] = useState(null); // null | { mode: "create" | "edit", data?: {} }
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canWrite = user?.role === "analyst" || user?.role === "admin";
  const canDelete = user?.role === "admin";

  useEffect(() => { fetchTransactions(); }, [page, filters]);

  const openCreate = () => { setFormError(""); setModal({ mode: "create" }); };
  const openEdit = (t) => {
    setFormError("");
    setModal({ mode: "edit", data: { ...t, date: t.date?.slice(0, 10) } });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (payload) => {
    setFormLoading(true);
    setFormError("");
    const result =
      modal.mode === "create"
        ? await createTransaction(payload)
        : await updateTransaction(modal.data._id, payload);
    setFormLoading(false);
    if (result.success) closeModal();
    else setFormError(result.message);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    await deleteTransaction(deleteId);
    setDeleteLoading(false);
    setDeleteId(null);
  };

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 text-sm mt-1">{total} record{total !== 1 ? "s" : ""} found</p>
          </div>
          {canWrite && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Transaction
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <Filter size={15} /> Filters
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ type: e.target.value })}
                className="input py-1.5 text-sm w-32"
              >
                <option value="">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) => setFilters({ category: e.target.value })}
                  placeholder="Search…"
                  className="input py-1.5 pl-8 text-sm w-40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ startDate: e.target.value })}
                className="input py-1.5 text-sm w-38"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ endDate: e.target.value })}
                className="input py-1.5 text-sm w-38"
              />
            </div>

            {(filters.type || filters.category || filters.startDate || filters.endDate) && (
              <button
                onClick={() => setFilters({ type: "", category: "", startDate: "", endDate: "" })}
                className="text-sm text-indigo-600 hover:underline self-end pb-1.5"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transactions found.</p>
              <p className="text-sm">Try adjusting your filters{canWrite ? " or add a new record." : "."}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Date", "Category", "Type", "Amount", "Notes", "Created By", canWrite || canDelete ? "Actions" : ""].map(
                        (h, i) => h && <th key={i} className="text-left text-gray-500 font-medium pb-3 pr-4 whitespace-nowrap">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((t) => (
                      <tr key={t._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="py-3.5 pr-4 text-gray-500 whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3.5 pr-4 font-medium text-gray-800">{t.category}</td>
                        <td className="py-3.5 pr-4">
                          <span className={t.type === "income" ? "badge-income" : "badge-expense"}>
                            {t.type === "income"
                              ? <ArrowUpRight size={10} className="inline mr-0.5" />
                              : <ArrowDownRight size={10} className="inline mr-0.5" />}
                            {t.type}
                          </span>
                        </td>
                        <td className={`py-3.5 pr-4 font-semibold whitespace-nowrap ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                        </td>
                        <td className="py-3.5 pr-4 text-gray-400 max-w-[200px] truncate">{t.notes || "—"}</td>
                        <td className="py-3.5 pr-4 text-gray-500">{t.createdBy?.name || "—"}</td>
                        {(canWrite || canDelete) && (
                          <td className="py-3.5">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canWrite && (
                                <button
                                  onClick={() => openEdit(t)}
                                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => setDeleteId(t._id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchTransactions(); }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === "create" ? "Add Transaction" : "Edit Transaction"}
      >
        <TransactionForm
          initial={modal?.data}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Transaction" maxWidth="max-w-sm">
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={deleteLoading} className="btn-danger flex-1">
            {deleteLoading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </Layout>
  );
};

export default Transactions;
