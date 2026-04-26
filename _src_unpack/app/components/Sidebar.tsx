import React from "react";
import { NavLink, useNavigate } from "react-router";
import { LayoutDashboard, Package, DollarSign, Users, Settings, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { useApp } from "../context/AppContext";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/sales", icon: DollarSign, label: "Sales" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const { logout, currentUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    // Hide Users tab for employees and managers
    if (item.to === "/users" && currentUser?.role !== "Admin") {
      return false;
    }
    // Hide Sales tab for employees
    if (item.to === "/sales" && currentUser?.role === "Employee") {
      return false;
    }
    return true;
  });

  return (
    <aside
      className="flex flex-col h-full w-52 flex-shrink-0"
      style={{ background: "#111827" }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Logo size="sm" dark />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
