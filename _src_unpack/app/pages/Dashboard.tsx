import React from "react";
import { Package, Layers, Bell, UserCircle, TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApp } from "../context/AppContext";

export function Dashboard() {
  const { currentUser, products, sales } = useApp();

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockAlerts = products.filter(p => p.quantity <= 10).length;
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  const lowStockProducts = products.filter(p => p.quantity <= 10).slice(0, 5);
  const recentActivity = sales.slice(-5).reverse();

  const stockByCategory = products.reduce((acc, product) => {
    const existing = acc.find(item => item.category === product.category);
    if (existing) {
      existing.stock += product.quantity;
    } else {
      acc.push({ category: product.category, stock: product.quantity });
    }
    return acc;
  }, [] as Array<{ category: string; stock: number }>);

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      sub: "Unique products in inventory",
      icon: Package,
      borderColor: "border-[#C2185B]",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Total Stock",
      value: totalStock,
      sub: "Total items across all products",
      icon: Layers,
      borderColor: "border-[#1565C0]",
      trend: "+8%",
      trendUp: true,
    },
    {
      label: "Total Sales",
      value: `₱${totalSales.toLocaleString("en-PH")}`,
      sub: "All-time revenue",
      icon: Activity,
      borderColor: "border-[#2E7D32]",
      trend: "+23%",
      trendUp: true,
    },
    {
      label: "Low Stock Alerts",
      value: lowStockAlerts,
      sub: "Products with 10 or fewer items",
      icon: Bell,
      borderColor: "border-[#F57C00]",
      trend: "-5%",
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, borderColor, trend, trendUp }) => (
          <div key={label} className={`bg-white rounded-lg border-l-4 ${borderColor} shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
              <Icon size={18} className="text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">{sub}</div>
              <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{sale.productName}</div>
                    <div className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString("en-PH")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#C2185B]">₱{sale.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-500">Qty: {sale.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>

        {/* Stock Levels by Category */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Stock by Category</h2>
          {stockByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="stock" fill="#C2185B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Low Stock Items */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-[#F57C00]" />
            <h2 className="text-lg font-bold text-gray-900">Low Stock Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {lowStockProducts.map(product => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-1 truncate">{product.name}</div>
                <div className="text-xs text-gray-500 mb-2">{product.sku}</div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  product.quantity === 0 ? 'bg-[#C62828] text-white' : 'bg-[#F57C00] text-white'
                }`}>
                  {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
