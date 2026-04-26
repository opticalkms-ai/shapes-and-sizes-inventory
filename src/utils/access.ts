import type { UserRole } from "../context/AppContext";

export type AppSection =
  | "dashboard"
  | "inventory"
  | "pos"
  | "sales"
  | "users"
  | "settings";

const ROLE_ACCESS: Record<UserRole, AppSection[]> = {
  Admin: ["dashboard", "inventory", "pos", "sales", "users", "settings"],
  Manager: ["inventory", "sales"],
  Employee: ["pos"],
};

export function canAccessSection(role: UserRole | undefined, section: AppSection) {
  if (!role) return false;
  return ROLE_ACCESS[role].includes(section);
}

export function getDefaultRouteForRole(role: UserRole | undefined) {
  if (role === "Manager") return "/inventory";
  if (role === "Employee") return "/pos";
  return "/dashboard";
}

export function getSectionFromPath(pathname: string): AppSection | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  switch (firstSegment) {
    case "dashboard":
    case "inventory":
    case "pos":
    case "sales":
    case "users":
    case "settings":
      return firstSegment;
    default:
      return null;
  }
}
