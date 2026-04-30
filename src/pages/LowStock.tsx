import React, { useMemo, useState } from "react";
import { AlertTriangle, Package, Search } from "lucide-react";
import { useApp } from "../context/AppContext";

const LOW_STOCK_THRESHOLD = 10;

export function LowStock() {
  const { products } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products
        .filter(product => product.quantity <= LOW_STOCK_THRESHOLD)
        .map(product => product.category)
        .filter(Boolean),
    );
    return Array.from(uniqueCategories).sort();
  }, [products]);

  const lowStockProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter(product => product.quantity <= LOW_STOCK_THRESHOLD)
      .filter(product => (categoryFilter === "all" ? true : product.category === categoryFilter))
      .filter(product => {
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          (product.sku || "").toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));
  }, [products, categoryFilter, search]);

  const outOfStockCount = lowStockProducts.filter(product => product.quantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Low Stock Products</h1>
          <p className="text-sm text-gray-500">
            Products with {LOW_STOCK_THRESHOLD} items or fewer.
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5">
          <div className="text-xs font-medium uppercase tracking-wide text-orange-700">Alert Summary</div>
          <div className="text-sm text-orange-800">
            {lowStockProducts.length} low stock • {outOfStockCount} out of stock
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search low stock products..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <h2 className="text-base font-semibold text-gray-700">No low stock products</h2>
          <p className="mt-1 text-sm text-gray-400">Everything is above your stock threshold.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lowStockProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.sku || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.quantity === 0
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        <AlertTriangle size={12} />
                        {product.quantity === 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
