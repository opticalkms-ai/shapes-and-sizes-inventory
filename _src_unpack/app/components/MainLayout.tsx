import React from "react";
import { Outlet, Navigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { useApp } from "../context/AppContext";

export function MainLayout() {
  const { currentUser } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end px-6 py-3 bg-white border-b border-gray-200">
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
