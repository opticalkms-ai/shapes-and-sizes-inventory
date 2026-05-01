import React, { useState } from "react";
import { Plus, Pencil, Trash2, X, Building2, MapPin, Users as UsersIcon } from "lucide-react";
import { useApp, Branch, User } from "../context/AppContext";
import { toast } from "sonner";

interface BranchFormData {
  name: string;
  location: string;
  manager: string;
}

const emptyForm: BranchFormData = {
  name: "", location: "", manager: "",
};

export function Branches() {
  const { branches, users, currentUser, addBranch, updateBranch, deleteBranch, updateUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const isAdmin = currentUser?.role === "Admin";

  // Restrict access for non-admins
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Only Admins can access branch management.
          </p>
        </div>
      </div>
    );
  }

  const openAdd = () => {
    setEditBranch(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (branch: Branch) => {
    setEditBranch(branch);
    setForm({
      name: branch.name,
      location: branch.location,
      manager: branch.manager || "",
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Location is required");
      return;
    }

    if (editBranch) {
      updateBranch(editBranch.id, {
        name: form.name.trim(),
        location: form.location.trim(),
        manager: form.manager.trim(),
      });
      toast.success(`${form.name} branch has been updated.`);
    } else {
      addBranch({
        name: form.name.trim(),
        location: form.location.trim(),
        manager: form.manager.trim(),
      });
      toast.success(`${form.name} branch has been added.`);
    }

    setShowModal(false);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    deleteBranch(id);
    setDeleteConfirm(null);
    toast.success("Branch has been deleted.");
  };

  const handleAssignEmployees = () => {
    if (!selectedBranch) return;

    selectedEmployees.forEach(userId => {
      updateUser(userId, { branchId: selectedBranch.id });
    });

    toast.success(`${selectedEmployees.length} employee(s) assigned to ${selectedBranch.name}`);
    setShowAssignModal(false);
    setSelectedEmployees([]);
    setSelectedBranch(null);
  };

  const branchEmployees = (branchId: string) => {
    return users.filter(u => u.branchId === branchId);
  };

  const availableEmployees = users.filter(u => u.role !== "Admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">Manage company branches and assign staff</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#C2185B] text-white rounded-lg hover:bg-[#A01647] transition-colors"
        >
          <Plus size={18} />
          New Branch
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(branch => {
          const branchStaff = branchEmployees(branch.id);
          return (
            <div
              key={branch.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#C2185B]/10 rounded-lg">
                    <Building2 size={20} className="text-[#C2185B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={14} />
                      {branch.location}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(branch)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(branch.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {branch.manager && (
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Manager:</span> {branch.manager}
                </p>
              )}

              {/* Staff Section */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UsersIcon size={16} />
                    Staff ({branchStaff.length})
                  </div>
                </div>
                {branchStaff.length > 0 ? (
                  <div className="space-y-1">
                    {branchStaff.map(employee => (
                      <div key={employee.id} className="text-xs text-gray-600">
                        • {employee.firstName} {employee.lastName} ({employee.role})
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No staff assigned</p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedBranch(branch);
                  setShowAssignModal(true);
                }}
                className="w-full py-2 px-3 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium"
              >
                Assign Staff
              </button>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editBranch ? "Edit Branch" : "Add New Branch"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                  placeholder="e.g., Pangasinan Branch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                  placeholder="e.g., Dagupan City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager (Optional)
                </label>
                <input
                  type="text"
                  value={form.manager}
                  onChange={e => setForm({ ...form, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                  placeholder="e.g., Abegail Santos"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-[#C2185B] text-white rounded-lg hover:bg-[#A01647] transition-colors font-medium"
              >
                {editBranch ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                Assign Staff to {selectedBranch.name}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {availableEmployees.length > 0 ? (
                availableEmployees.map(employee => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                        }
                      }}
                      className="w-4 h-4 text-[#C2185B] rounded focus:ring-2 focus:ring-[#C2185B]"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{employee.role}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No employees available</p>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignEmployees}
                disabled={selectedEmployees.length === 0}
                className="flex-1 px-4 py-2 bg-[#C2185B] text-white rounded-lg hover:bg-[#A01647] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign ({selectedEmployees.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Branch?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. Are you sure you want to delete this branch?
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
