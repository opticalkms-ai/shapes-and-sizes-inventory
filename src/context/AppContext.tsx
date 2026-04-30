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
  transactionId?: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  date: string;
  cashierName?: string;
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
  checkoutSale: (items: Array<{ productId: string; quantity: number }>) => {
    success: boolean;
    message: string;
    transactionId?: string;
    totalAmount?: number;
  };
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
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [salesLoaded, setSalesLoaded] = useState(false);

  const syncUsersToServer = async (nextUsers: User[]) => {
    try {
      const result = await api.saveUsers(nextUsers);
      if (!result.success) {
        console.error("Failed to save users:", result.message);
      }
    } catch (error) {
      console.error("Error saving users:", error);
    }
  };

  const syncProductsToServer = async (nextProducts: Product[]) => {
    try {
      const result = await api.saveInventory(nextProducts);
      if (!result.success) {
        console.error("Failed to save inventory:", result.message);
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
  };

  const syncSalesToServer = async (nextSales: Sale[]) => {
    try {
      const result = await api.saveSales(nextSales);
      if (!result.success) {
        console.error("Failed to save sales:", result.message);
      }
    } catch (error) {
      console.error("Error saving sales:", error);
    }
  };

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales)); }, [sales]);
  useEffect(() => {
    if (currentUser) localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEYS.currentUser);
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const result = await api.getUsers();

        if (cancelled) return;

        if (result.success && Array.isArray(result.users)) {
          if (result.users.length > 0) {
            setUsers(result.users);

            if (currentUser) {
              const matchingUser = result.users.find(
                (user: User) => user.id === currentUser.id || user.email === currentUser.email,
              );

              if (matchingUser) {
                setCurrentUser(matchingUser);
              } else {
                setCurrentUser(null);
              }
            }
          } else if (users.length > 0) {
            await syncUsersToServer(users);
          }
        } else {
          console.error("Failed to load users:", result.message);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading users:", error);
        }
      } finally {
        if (!cancelled) {
          setUsersLoaded(true);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      try {
        const result = await api.getInventory();

        if (cancelled) return;

        if (result.success && Array.isArray(result.products)) {
          if (result.products.length > 0) {
            setProducts(result.products);
          } else if (products.length > 0) {
            await syncProductsToServer(products);
          }
        } else {
          console.error("Failed to load inventory:", result.message);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading inventory:", error);
        }
      } finally {
        if (!cancelled) {
          setInventoryLoaded(true);
        }
      }
    };

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSales = async () => {
      try {
        const result = await api.getSales();

        if (cancelled) return;

        if (result.success && Array.isArray(result.sales)) {
          if (result.sales.length > 0) {
            setSales(result.sales);
          } else if (sales.length > 0) {
            await syncSalesToServer(sales);
          }
        } else {
          console.error("Failed to load sales:", result.message);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading sales:", error);
        }
      } finally {
        if (!cancelled) {
          setSalesLoaded(true);
        }
      }
    };

    void loadSales();

    return () => {
      cancelled = true;
    };
  }, []);

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
        setUsers(prev => {
          const nextUsers = [...prev, newUser];
          if (usersLoaded) {
            void syncUsersToServer(nextUsers);
          }
          return nextUsers;
        });
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
    if (usersLoaded) {
      void syncUsersToServer(updatedUsers);
    }

    if (currentUser?.email === email) {
      setCurrentUser(updatedUsers[userIndex]);
    }

    return { success: true, message: "Password reset successful" };
  };

  const addProduct = (product: Omit<Product, "id" | "addedDate">) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      addedDate: new Date().toISOString(),
    };
    setProducts(prev => {
      const nextProducts = [...prev, newProduct];
      if (inventoryLoaded) {
        void syncProductsToServer(nextProducts);
      }
      return nextProducts;
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const nextProducts = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      if (inventoryLoaded) {
        void syncProductsToServer(nextProducts);
      }
      return nextProducts;
    });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const nextProducts = prev.filter(p => p.id !== id);
      if (inventoryLoaded) {
        void syncProductsToServer(nextProducts);
      }
      return nextProducts;
    });
  };

  const checkoutSale = (items: Array<{ productId: string; quantity: number }>) => {
    if (!currentUser) {
      return { success: false, message: "You must be logged in to complete a sale." };
    }

    if (items.length === 0) {
      return { success: false, message: "Add at least one product to the cart." };
    }

    const normalizedItems = items
      .filter(item => item.quantity > 0)
      .reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

    const transactionItems = Object.entries(normalizedItems).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    for (const item of transactionItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return { success: false, message: "One or more products no longer exist." };
      }

      if (product.quantity < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${product.name}".`,
        };
      }
    }

    const transactionId = `TXN-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const cashierName = `${currentUser.firstName} ${currentUser.lastName}`;

    const updatedProducts = products.map(product => {
      const transactionItem = transactionItems.find(item => item.productId === product.id);
      if (!transactionItem) return product;
      return {
        ...product,
        quantity: product.quantity - transactionItem.quantity,
      };
    });

    const newSales: Sale[] = transactionItems.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        id: `${transactionId}-${item.productId}`,
        transactionId,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        pricePerUnit: product.price,
        totalAmount: product.price * item.quantity,
        date: timestamp,
        cashierName,
      };
    });

    const nextSales = [...sales, ...newSales];
    const totalAmount = newSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    setProducts(updatedProducts);
    setSales(nextSales);

    if (inventoryLoaded) {
      void syncProductsToServer(updatedProducts);
    }
    if (salesLoaded) {
      void syncSalesToServer(nextSales);
    }

    return {
      success: true,
      message: `Transaction ${transactionId} completed successfully.`,
      transactionId,
      totalAmount,
      date: timestamp,
    };
  };

  const recordSale = (productId: string, quantity: number) => {
    const result = checkoutSale([{ productId, quantity }]);
    if (!result.success) {
      return { success: false, message: result.message };
    }

    const product = products.find(p => p.id === productId);
    return {
      success: true,
      message: `Sale of ${quantity} x "${product?.name}" has been successfully recorded.`,
    };
  };

  const clearSales = () => {
    setSales([]);
    if (salesLoaded) {
      void syncSalesToServer([]);
    }
  };

  const addUser = (user: Omit<User, "id" | "createdAt">) => {
    const newUser: User = { ...user, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setUsers(prev => {
      const nextUsers = [...prev, newUser];
      if (usersLoaded) {
        void syncUsersToServer(nextUsers);
      }
      return nextUsers;
    });
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => {
      const nextUsers = prev.map(u => u.id === id ? { ...u, ...updates } : u);
      if (usersLoaded) {
        void syncUsersToServer(nextUsers);
      }
      return nextUsers;
    });
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => {
      const nextUsers = prev.filter(u => u.id !== id);
      if (usersLoaded) {
        void syncUsersToServer(nextUsers);
      }
      return nextUsers;
    });
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, products, sales, pendingUser, generatedOtp,
      login, logout, registerUser, verifyOtp, sendPasswordResetOtp, resetPassword,
      addProduct, updateProduct, deleteProduct, recordSale, clearSales,
      checkoutSale,
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
