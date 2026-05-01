import React, { useState, useMemo } from "react";
import { Trash2, DollarSign, ShoppingCart, TrendingUp, Download, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { Navigate } from "react-router";

export function Sales() {
  const { sales, branches, clearSales, currentUser } = useApp();

  // Only Managers and Admins can access Sales
  if (currentUser?.role === "Employee") {
    return <Navigate to="/inventory" replace />;
  }
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredSales = useMemo(() => {
    let result = [...sales];

    // Branch filter
    if (selectedBranch !== "all") {
      result = result.filter(s => s.branchId === selectedBranch);
    }

    if (selectedDate) {
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      result = result.filter(s => {
        const saleDate = new Date(s.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === selected.getTime();
      });
    } else if (dateFilter === "today") {
      result = result.filter(s => {
        const saleDate = new Date(s.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      });
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(s => new Date(s.date) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter(s => new Date(s.date) >= monthAgo);
    }

    if (searchTerm) {
      result = result.filter(s => s.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return result;
  }, [sales, dateFilter, selectedDate, searchTerm, today, selectedBranch]);

  const salesToday = sales.filter(s => {
    const saleDate = new Date(s.date);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === today.getTime();
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);
  const salesTodayCount = salesToday.length;

  const bestSellingProducts = useMemo(() => {
    const counts = filteredSales.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([productName, quantity]) => ({ productName, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [filteredSales]);

  const salesByBranch = useMemo(() => {
    const branchSales: Record<string, number> = {};
    
    sales.forEach(sale => {
      const branchId = sale.branchId || "Unassigned";
      const branchName = branches.find(b => b.id === branchId)?.name || "Unassigned";
      branchSales[branchName] = (branchSales[branchName] || 0) + sale.totalAmount;
    });

    return Object.entries(branchSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales, branches]);

  const COLORS = ["#C2185B", "#D81B60", "#E1BEE7", "#AD1457", "#880E4F", "#F50057", "#FF4081"];

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No sales data to export");
      return;
    }

    const headers = ["Product", "Quantity", "Price/Unit", "Total Amount", "Branch", "Date"];
    const csvRows = [
      headers.join(","),
      ...filteredSales.map(s => {
        const branchName = branches.find(b => b.id === s.branchId)?.name || "Unassigned";
        return [
          `"${s.productName}"`,
          s.quantity,
          s.pricePerUnit,
          s.totalAmount,
          `"${branchName}"`,
          `"${formatDate(s.date)}"`
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Sales data exported successfully");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500">View purchase history, find purchases by date and branch, and see top-selling products.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Sales Today</span>
            <ShoppingCart size={18} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{salesTodayCount}</div>
          <div className="text-xs text-gray-400">Transactions</div>
        </div>

        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</span>
            <DollarSign size={18} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString("en-PH")}</div>
          <div className="text-xs text-gray-400">All-time earnings</div>
        </div>

        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Items Sold</span>
            <TrendingUp size={18} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalItemsSold}</div>
          <div className="text-xs text-gray-400">Total units</div>
        </div>
      </div>

      {/* Sales by Branch Chart */}
      {salesByBranch.length > 0 && (
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Sales by Branch</h2>
              <p className="text-xs text-gray-400">Revenue breakdown across branches</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByBranch}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₱${(value / 1000).toFixed(0)}K`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesByBranch.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Best Selling Products */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Best Selling Products</h2>
            <p className="text-xs text-gray-400">Products with the most quantity sold.</p>
          </div>
        </div>
        {bestSellingProducts.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No transactions yet to generate a product ranking.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bestSellingProducts} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="productName" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}`, "Units"]} />
                <Bar dataKey="quantity" fill="#C2185B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Sales History */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Transaction History</h2>
              <p className="text-xs text-gray-400">A list of all completed purchases</p>
            </div>
            {sales.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                >
                  <option value="all">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                  aria-label="Find by purchase date"
                />
                <button
                  onClick={() => setSelectedDate("")}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 rounded px-3 py-1.5 text-sm transition-colors"
                >
                  Clear Date
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded px-3 py-1.5 text-sm transition-colors"
                >
                  <Download size={14} />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded px-3 py-1.5 text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center">
            <DollarSign size={48} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No transactions have been recorded yet</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">No sales match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Product</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Quantity</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Price/Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Branch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredSales].reverse().map(sale => {
                  const branchName = branches.find(b => b.id === sale.branchId)?.name || "Unassigned";
                  return (
                    <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900">{sale.productName}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{sale.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        ₱{sale.pricePerUnit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#C2185B]">
                        ₱{sale.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">{branchName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(sale.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">Total ({filteredSales.length} transactions)</td>
                  <td className="px-4 py-3 text-right font-bold text-[#C2185B]">
                    ₱{filteredSales.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Clear Confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-2">Clear Sales History</h2>
            <p className="text-sm text-gray-500 mb-5">Are you sure you want to clear all sales history? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { clearSales(); setShowClearConfirm(false); toast.success("Sales history cleared."); }}
                className="px-4 py-2 text-sm bg-[#C62828] hover:bg-red-700 text-white rounded-md font-semibold transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
