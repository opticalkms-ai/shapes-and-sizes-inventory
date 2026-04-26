import React from "react";
import { NavLink, useNavigate } from "react-router";
import { LayoutDashboard, Package, DollarSign, Users, Settings, LogOut, ShoppingCart, X } from "lucide-react";
import { Logo } from "./Logo";
import { useApp } from "../context/AppContext";
import { canAccessSection } from "../utils/access";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/pos", icon: ShoppingCart, label: "POS" },
  { to: "/sales", icon: DollarSign, label: "Sales" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, currentUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/login");
  };

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    const section = item.to.replace("/", "") as
      | "dashboard"
      | "inventory"
      | "pos"
      | "sales"
      | "users"
      | "settings";
    return canAccessSection(currentUser?.role, section);
  });

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-52 flex-col border-r border-white/10 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ background: "#111827" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
        <Logo size="sm" dark />
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-[#C2185B] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
