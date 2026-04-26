import React, { useState, useMemo } from "react";
import { Plus, Trash2, X, DollarSign, ShoppingCart, TrendingUp, Download, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { Navigate } from "react-router";

export function Sales() {
  const { sales, products, recordSale, clearSales, currentUser } = useApp();

  // Only Managers and Admins can access Sales
  if (currentUser?.role === "Employee") {
    return <Navigate to="/inventory" replace />;
  }
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const availableProducts = products.filter(p => p.quantity > 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredSales = useMemo(() => {
    let result = [...sales];

    if (dateFilter === "today") {
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
  }, [sales, dateFilter, searchTerm, today]);

  const salesToday = sales.filter(s => {
    const saleDate = new Date(s.date);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === today.getTime();
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);
  const salesTodayCount = salesToday.length;

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No sales data to export");
      return;
    }

    const headers = ["Product", "Quantity", "Price/Unit", "Total Amount", "Date"];
    const csvRows = [
      headers.join(","),
      ...filteredSales.map(s => [
        `"${s.productName}"`,
        s.quantity,
        s.pricePerUnit,
        s.totalAmount,
        `"${formatDate(s.date)}"`
      ].join(","))
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

  const handleRecord = () => {
    if (!selectedProductId) { toast.error("Please select a product"); return; }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) { toast.error("Invalid quantity"); return; }
    const result = recordSale(selectedProductId, qty);
    if (result.success) {
      toast.success(result.message, { description: "Sale Recorded" });
      setShowModal(false);
      setSelectedProductId("");
      setQuantity("1");
    } else {
      toast.error(result.message);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Transactions</h1>
          <p className="text-sm text-gray-500">Record new sales and view transaction history.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Record Sale
        </button>
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

      {/* Sales History */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Sales History</h2>
              <p className="text-xs text-gray-400">A list of all sales transactions</p>
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
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
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
            <p className="text-sm text-gray-500 mb-4">No sales have been recorded yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              Record First Sale
            </button>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredSales].reverse().map(sale => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900">{sale.productName}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{sale.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      ₱{sale.pricePerUnit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#C2185B]">
                      ₱{sale.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(sale.date)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">Total ({filteredSales.length} transactions)</td>
                  <td className="px-4 py-3 text-right font-bold text-[#C2185B]">
                    ₱{filteredSales.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-900">Record a New Sale</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Select a product and enter the quantity sold. The stock level will be automatically updated.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Product</label>
                {availableProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 border border-gray-200 rounded-lg px-3 py-2">No products with stock available.</p>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={e => { setSelectedProductId(e.target.value); setQuantity("1"); }}
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] bg-white"
                  >
                    <option value="">Select a product...</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity} in stock)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Quantity Sold</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.quantity}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-400 mt-1">
                    Max: {selectedProduct.quantity} — Est. Total: ₱{(selectedProduct.price * (parseInt(quantity) || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleRecord}
                className="px-5 py-2 text-sm bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md font-semibold transition-colors"
              >
                Record Sale
              </button>
            </div>
          </div>
        </div>
      )}

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
