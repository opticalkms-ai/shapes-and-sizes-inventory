import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../utils/api";

export type UserRole = "Admin" | "Manager" | "Employee";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  price: number;
  addedDate: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  date: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
  sales: Sale[];
  pendingUser: Omit<User, "id" | "createdAt"> | null;
  generatedOtp: string | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  registerUser: (userData: Omit<User, "id" | "createdAt">) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  sendPasswordResetOtp: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  resetPassword: (email: string, newPassword: string) => { success: boolean; message: string };
  addProduct: (product: Omit<Product, "id" | "addedDate">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordSale: (productId: string, quantity: number) => { success: boolean; message: string };
  clearSales: () => void;
  addUser: (user: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  users: "sns_users",
  products: "sns_products",
  sales: "sns_sales",
  currentUser: "sns_current_user",
};

const defaultAdmin: User = {
  id: "1",
  firstName: "Jerome",
  lastName: "Aceebuche",
  middleName: "M",
  email: "admin@shapesandsizes.com",
  password: "admin123",
  role: "Admin",
  createdAt: new Date().toISOString(),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.users);
    if (stored) return JSON.parse(stored);
    return [defaultAdmin];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.products);
    return stored ? JSON.parse(stored) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.sales);
    return stored ? JSON.parse(stored) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.currentUser);
    return stored ? JSON.parse(stored) : null;
  });

  const [pendingUser, setPendingUser] = useState<Omit<User, "id" | "createdAt"> | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales)); }, [sales]);
  useEffect(() => {
    if (currentUser) localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEYS.currentUser);
  }, [currentUser]);

  const login = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return { success: true, message: "Login successful" };
    }
    return { success: false, message: "Invalid email or password" };
  };

  const logout = () => setCurrentUser(null);

  const registerUser = async (userData: Omit<User, "id" | "createdAt">) => {
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: "Email already exists" };
    }
    
    // Call server to send OTP email
    try {
      const result = await api.sendOtp(userData.email, userData.firstName);

      if (result.success) {
        setPendingUser(userData);
        // Store demo OTP if returned (for when email isn't configured)
        if (result.otp) {
          setGeneratedOtp(result.otp);
        } else {
          setGeneratedOtp(null);
        }
        return { success: true, message: result.message, otp: result.otp };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      return { success: false, message: "Failed to send OTP. Please try again." };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const result = await api.verifyOtp(email, otp);

      if (result.success && pendingUser) {
        const newUser: User = {
          ...pendingUser,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setUsers(prev => [...prev, newUser]);
        setPendingUser(null);
        setGeneratedOtp(null);
        return { success: true, message: "Account verified successfully" };
      } else {
        return { success: false, message: result.message || "Invalid OTP" };
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return { success: false, message: "Failed to verify OTP. Please try again." };
    }
  };

  const sendPasswordResetOtp = async (email: string) => {
    try {
      const result = await api.sendResetOtp(email);

      if (result.success) {
        // Store demo OTP if returned (for when email isn't configured)
        if (result.otp) {
          setGeneratedOtp(result.otp);
        } else {
          setGeneratedOtp(null);
        }
        return { success: true, message: result.message, otp: result.otp };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error sending password reset OTP:", error);
      return { success: false, message: "Failed to send password reset OTP. Please try again." };
    }
  };

  const resetPassword = (email: string, newPassword: string) => {
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex === -1) return { success: false, message: "User not found" };
    
    const updatedUsers = [...users];
    updatedUsers[userIndex].password = newPassword;
    setUsers(updatedUsers);
    return { success: true, message: "Password reset successful" };
  };

  const addProduct = (product: Omit<Product, "id" | "addedDate">) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      addedDate: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const recordSale = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, message: "Product not found" };
    if (product.quantity < quantity) return { success: false, message: "Insufficient stock" };
    const sale: Sale = {
      id: Date.now().toString(),
      productId,
      productName: product.name,
      quantity,
      pricePerUnit: product.price,
      totalAmount: product.price * quantity,
      date: new Date().toISOString(),
    };
    setSales(prev => [...prev, sale]);
    updateProduct(productId, { quantity: product.quantity - quantity });
    return { success: true, message: `Sale of ${quantity} x "${product.name}" has been successfully recorded.` };
  };

  const clearSales = () => setSales([]);

  const addUser = (user: Omit<User, "id" | "createdAt">) => {
    const newUser: User = { ...user, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, products, sales, pendingUser, generatedOtp,
      login, logout, registerUser, verifyOtp, sendPasswordResetOtp, resetPassword,
      addProduct, updateProduct, deleteProduct, recordSale, clearSales,
      addUser, updateUser, deleteUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}