import React from "react";
import { Navigate } from "react-router";
import { useApp } from "../context/AppContext";
import { getDefaultRouteForRole } from "../utils/access";

export function HomeRedirect() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
}
