import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, UserCheck, UserX, ShieldAlert } from "lucide-react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import useUserStore from "../stores/userStore";
import useAuthStore from "../stores/authStore";

const EMPTY_FORM = { name: "", email: "", password: "", role: "viewer" };

const UserForm = ({ initial, onSubmit, onCancel, loading, error, isEdit }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
        <input
          name="name"
          required
          value={form.name}
          onChange={handle}
          placeholder="Jane Doe"
          className="input"
        />
      </div>

      {!isEdit && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handle}
              placeholder="jane@example.com"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handle}
              placeholder="Min. 6 characters"
              className="input"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
        <select name="role" value={form.role} onChange={handle} className="input">
          <option value="viewer">Viewer</option>
          <option value="analyst">Analyst</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {form.role === "viewer" && "Can view dashboard and transactions only."}
          {form.role === "analyst" && "Can create and edit their own transactions."}
          {form.role === "admin" && "Full access including user management."}
        </p>
      </div>

      {isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select name="status" value={form.status} onChange={handle} className="input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Saving…" : isEdit ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
};

const RoleBadge = ({ role }) => {
  const map = { admin: "badge-admin", analyst: "badge-analyst", viewer: "badge-viewer" };
  return <span className={map[role] || "badge-viewer"}>{role}</span>;
};

const Users = () => {
  const { user: me } = useAuthStore();
  const {
    users, total, page, pages, loading,
    fetchUsers, setPage, createUser, updateUser, deleteUser,
  } = useUserStore();

  const [modal, setModal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, [page]);

  const openCreate = () => { setFormError(""); setModal({ mode: "create" }); };
  const openEdit = (u) => { setFormError(""); setModal({ mode: "edit", data: u }); };
  const closeModal = () => setModal(null);

  const handleSubmit = async (payload) => {
    setFormLoading(true);
    setFormError("");
    const result =
      modal.mode === "create"
        ? await createUser(payload)
        : await updateUser(modal.data._id, payload);
    setFormLoading(false);
    if (result.success) closeModal();
    else setFormError(result.message);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    await deleteUser(deleteId);
    setDeleteLoading(false);
    setDeleteId(null);
  };

  const toggleStatus = async (u) => {
    await updateUser(u._id, { status: u.status === "active" ? "inactive" : "active" });
  };

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-500 text-sm mt-1">{total} user{total !== 1 ? "s" : ""} in the system</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add User
          </button>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShieldAlert size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No users found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                        <th key={h} className="text-left text-gray-500 font-medium pb-3 pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                              u.role === "admin" ? "bg-purple-500" : u.role === "analyst" ? "bg-blue-500" : "bg-gray-400"
                            }`}>
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-500">{u.email}</td>
                        <td className="py-3.5 pr-4"><RoleBadge role={u.role} /></td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => toggleStatus(u)}
                              disabled={u._id === me?._id || u._id === me?.id}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={u.status === "active" ? "Deactivate" : "Activate"}
                            >
                              {u.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button
                              onClick={() => setDeleteId(u._id)}
                              disabled={u._id === me?._id || u._id === me?.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetchUsers(); }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === "create" ? "Add User" : "Edit User"}
      >
        <UserForm
          initial={modal?.data}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={formLoading}
          error={formError}
          isEdit={modal?.mode === "edit"}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete User" maxWidth="max-w-sm">
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to permanently delete this user? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={deleteLoading} className="btn-danger flex-1">
            {deleteLoading ? "Deleting…" : "Delete User"}
          </button>
        </div>
      </Modal>
    </Layout>
  );
};

export default Users;
