import { createBrowserRouter, Navigate } from "react-router";
import { HomeRedirect } from "./components/HomeRedirect";
import { MainLayout } from "./components/MainLayout";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { OTPVerify } from "./pages/OTPVerify";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { POS } from "./pages/POS";
import { Sales } from "./pages/Sales";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/verify-otp",
    element: <OTPVerify />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "inventory", element: <Inventory /> },
      { path: "pos", element: <POS /> },
      { path: "sales", element: <Sales /> },
      { path: "users", element: <Users /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
