import React, { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useApp } from "../context/AppContext";
import { canAccessSection, getDefaultRouteForRole, getSectionFromPath } from "../utils/access";

export function MainLayout() {
  const { currentUser } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!currentUser) return <Navigate to="/login" replace />;

  const currentSection = getSectionFromPath(location.pathname);
  if (currentSection && !canAccessSection(currentUser.role, currentSection)) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-gray-950/30"
          aria-label="Close menu overlay"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 md:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Menu size={16} />
            <span>Menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {currentUser.firstName} {currentUser.lastName}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ background: "#C2185B" }}
            >
              {currentUser.firstName[0]}
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
