import React, { useState } from "react";
import { Plus, Pencil, Trash2, X, Users as UsersIcon, Eye, EyeOff, Building2 } from "lucide-react";
import { useApp, User, UserRole } from "../context/AppContext";
import { toast } from "sonner";

const ROLE_COLORS: Record<UserRole, string> = {
  Admin: "bg-[#C2185B] text-white",
  Manager: "bg-gray-100 text-gray-700",
  Employee: "bg-[#1565C0] text-white",
};

interface UserFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  role: UserRole;
  branchId: string;
}

const emptyForm: UserFormData = {
  firstName: "", lastName: "", middleName: "", email: "", password: "", role: "Employee", branchId: "",
};

export function Users() {
  const { users, branches, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "Admin";
  const canViewUsers = currentUser?.role === "Admin";

  // Restrict access for employees
  if (!canViewUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center">
          <UsersIcon size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            You don't have permission to view this page. Only Admins can access user management.
          </p>
        </div>
      </div>
    );
  }

  const openAdd = () => {
    setEditUser(null);
    setForm({ ...emptyForm, branchId: branches[0]?.id || "" });
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || "",
      email: user.email,
      password: user.password,
      role: user.role,
      branchId: user.branchId || "",
    });
    setShowPass(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error("Name is required"); return; }
    if (!form.email.trim()) { toast.error("Email is required"); return; }
    if (!editUser && !form.password) { toast.error("Password is required"); return; }

    if (editUser) {
      updateUser(editUser.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
        email: form.email.trim(),
        password: form.password || editUser.password,
        role: form.role,
        branchId: form.branchId || editUser.branchId,
      });
      toast.success(`${form.firstName} ${form.lastName} has been updated.`);
    } else {
      if (users.find(u => u.email === form.email.trim())) {
        toast.error("Email already exists"); return;
      }
      addUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        branchId: form.branchId || branches[0]?.id,
      });
      toast.success(`${form.firstName} ${form.lastName} has been added.`);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const user = users.find(u => u.id === id);
    deleteUser(id);
    setDeleteConfirm(null);
    toast.success(`${user?.firstName} ${user?.lastName} has been removed.`);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getBranchName = (branchId?: string) => {
    if (!branchId) return "-";
    return branches.find(b => b.id === branchId)?.name || "-";
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage system users and their roles.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Add User
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <UsersIcon size={36} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Branch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Joined</th>
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "#C2185B" }}
                        >
                          {user.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.middleName ? user.middleName[0] + ". " : ""}{user.lastName}
                          </p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-gray-400">You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded font-medium ${ROLE_COLORS[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      <div className="flex items-center gap-1">
                        <Building2 size={14} className="text-gray-400" />
                        {getBranchName(user.branchId)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <Pencil size={14} />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">{editUser ? "Edit User" : "Add User"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">First Name</label>
                  <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="John"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Last Name</label>
                  <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Middle Name <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input value={form.middleName} onChange={e => setForm(p => ({ ...p, middleName: e.target.value }))} placeholder="Quincy"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Password {editUser && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
                </label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] bg-white">
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Branch</label>
                <select value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] bg-white">
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 text-sm bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md font-semibold transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-2">Remove User</h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to remove "{users.find(u => u.id === deleteConfirm)?.firstName} {users.find(u => u.id === deleteConfirm)?.lastName}"?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm bg-[#C62828] hover:bg-red-700 text-white rounded-md font-semibold">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
