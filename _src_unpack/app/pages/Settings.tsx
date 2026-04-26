import React, { useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { PasswordStrengthIndicator, calculatePasswordStrength } from "../components/PasswordStrength";

export function Settings() {
  const { currentUser, updateUser } = useApp();
  const [form, setForm] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    middleName: currentUser?.middleName || "",
    email: currentUser?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [profileErrors, setProfileErrors] = useState({ firstName: "", lastName: "", email: "" });
  const [passwordErrors, setPasswordErrors] = useState({ current: "", new: "", confirm: "" });

  const handleProfileSave = () => {
    const errors = { firstName: "", lastName: "", email: "" };

    if (!form.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    setProfileErrors(errors);

    if (errors.firstName || errors.lastName || errors.email) {
      return;
    }

    if (!currentUser) return;
    updateUser(currentUser.id, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim(),
      email: form.email.trim(),
    });
    toast.success("Profile updated successfully", {
      style: { background: "#2E7D32", color: "white" }
    });
  };

  const handlePasswordSave = () => {
    const errors = { current: "", new: "", confirm: "" };

    if (!currentUser) return;

    if (!form.currentPassword) {
      errors.current = "Current password is required";
    } else if (form.currentPassword !== currentUser.password) {
      errors.current = "Current password is incorrect";
    }

    if (!form.newPassword) {
      errors.new = "New password is required";
    } else if (form.newPassword.length < 8) {
      errors.new = "Password must be at least 8 characters";
    } else {
      const passwordStrength = calculatePasswordStrength(form.newPassword);
      if (passwordStrength.strength === "weak") {
        errors.new = "Password is too weak. Please meet all requirements";
      }
    }

    if (!form.confirmPassword) {
      errors.confirm = "Please confirm your new password";
    } else if (form.newPassword !== form.confirmPassword) {
      errors.confirm = "Passwords do not match";
    }

    setPasswordErrors(errors);

    if (errors.current || errors.new || errors.confirm) {
      return;
    }

    updateUser(currentUser.id, { password: form.newPassword });
    setForm(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
    setPasswordErrors({ current: "", new: "", confirm: "" });
    toast.success("Password changed successfully", {
      style: { background: "#2E7D32", color: "white" }
    });
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account settings and preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-2">Profile Information</h2>
        <div className="h-px bg-gray-200 mb-6"></div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
              <input
                value={form.firstName}
                onChange={e => {
                  setForm(p => ({ ...p, firstName: e.target.value }));
                  setProfileErrors(p => ({ ...p, firstName: "" }));
                }}
                className={`w-full border ${profileErrors.firstName ? 'border-[#C62828]' : 'border-gray-300'} rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]`}
              />
              {profileErrors.firstName && (
                <p className="text-xs text-[#C62828] mt-1">{profileErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
              <input
                value={form.lastName}
                onChange={e => {
                  setForm(p => ({ ...p, lastName: e.target.value }));
                  setProfileErrors(p => ({ ...p, lastName: "" }));
                }}
                className={`w-full border ${profileErrors.lastName ? 'border-[#C62828]' : 'border-gray-300'} rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]`}
              />
              {profileErrors.lastName && (
                <p className="text-xs text-[#C62828] mt-1">{profileErrors.lastName}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Middle Name <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input
              value={form.middleName}
              onChange={e => setForm(p => ({ ...p, middleName: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => {
                setForm(p => ({ ...p, email: e.target.value }));
                setProfileErrors(p => ({ ...p, email: "" }));
              }}
              className={`w-full border ${profileErrors.email ? 'border-[#C62828]' : 'border-gray-300'} rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]`}
            />
            {profileErrors.email && (
              <p className="text-xs text-[#C62828] mt-1">{profileErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
            <input
              value={currentUser?.role || ""}
              disabled
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Role can only be changed by an administrator</p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleProfileSave}
              className="flex items-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-2">Change Password</h2>
        <div className="h-px bg-gray-200 mb-6"></div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPass ? "text" : "password"}
                value={form.currentPassword}
                onChange={e => {
                  setForm(p => ({ ...p, currentPassword: e.target.value }));
                  setPasswordErrors(p => ({ ...p, current: "" }));
                }}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                placeholder="••••••••"
                className={`w-full border ${passwordErrors.current ? 'border-[#C62828]' : 'border-gray-300'} rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]`}
              />
              <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordErrors.current && (
              <p className="text-xs text-[#C62828] mt-1">{passwordErrors.current}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                value={form.newPassword}
                onChange={e => {
                  setForm(p => ({ ...p, newPassword: e.target.value }));
                  setPasswordErrors(p => ({ ...p, new: "" }));
                }}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                placeholder="••••••••"
                className={`w-full border ${passwordErrors.new ? 'border-[#C62828]' : 'border-gray-300'} rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]`}
              />
              <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordErrors.new && (
              <p className="text-xs text-[#C62828] mt-1">{passwordErrors.new}</p>
            )}
            <PasswordStrengthIndicator password={form.newPassword} showRequirements={true} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={e => {
                  setForm(p => ({ ...p, confirmPassword: e.target.value }));
                  setPasswordErrors(p => ({ ...p, confirm: "" }));
                }}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                placeholder="••••••••"
                className={`w-full border ${passwordErrors.confirm ? 'border-[#C62828]' : 'border-gray-300'} rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordErrors.confirm && (
              <p className="text-xs text-[#C62828] mt-1">{passwordErrors.confirm}</p>
            )}
          </div>
          <div className="pt-2">
            <button
              onClick={handlePasswordSave}
              className="flex items-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Save size={14} />
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}