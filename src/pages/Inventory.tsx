import React, { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp, Product } from "../context/AppContext";
import { toast } from "sonner";

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  quantity: string;
  price: string;
}

const emptyForm: ProductFormData = { name: "", sku: "", category: "", quantity: "", price: "" };

const ITEMS_PER_PAGE = 10;

export function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      sku: product.sku || "",
      category: product.category || "",
      quantity: String(product.quantity),
      price: String(product.price),
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.category.trim()) { toast.error("Category is required"); return; }
    const qty = parseInt(form.quantity);
    const price = parseFloat(form.price);
    if (isNaN(qty) || qty < 0) { toast.error("Invalid quantity"); return; }
    if (isNaN(price) || price < 0) { toast.error("Invalid price"); return; }

    if (editProduct) {
      updateProduct(editProduct.id, { name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim(), quantity: qty, price });
      toast.success(`"${form.name}" has been updated.`);
    } else {
      addProduct({ name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim(), quantity: qty, price });
      toast.success(`"${form.name}" has been added to your inventory.`, { description: "Product Added" });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id);
    deleteProduct(id);
    setDeleteConfirm(null);
    toast.success(`"${product?.name}" has been removed.`);
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    );

    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stock") return b.quantity - a.quantity;
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "date") return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      return 0;
    });

    return result;
  }, [products, search, categoryFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", color: "bg-[#C62828] text-white" };
    if (quantity <= 10) return { label: "Low Stock", color: "bg-[#F57C00] text-white" };
    return { label: "In Stock", color: "bg-[#2E7D32] text-white" };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Manage your products and stock levels here.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Content */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-16 flex flex-col items-center text-center">
          <Package size={40} className="text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">Your Inventory is Empty</h3>
          <p className="text-sm text-gray-400 mb-4">Get started by adding your first product.</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Plus size={14} />
            Add Your First Product
          </button>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-4 mb-4">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
              />
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
              >
                <option value="name">Sort by Name</option>
                <option value="stock">Sort by Stock</option>
                <option value="price">Sort by Price</option>
                <option value="date">Sort by Date Added</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-sm">No products match your search.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Added</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedProducts.map(product => {
                        const status = getStockStatus(product.quantity);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{product.sku || "—"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">{product.quantity}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">₱{product.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(product.addedDate)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEdit(product)}
                                  className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(product.id)}
                                  className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                {editProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Product Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Red Velveta Cross Dress"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">SKU <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  value={form.sku}
                  onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                  placeholder="Dress-Large-Red"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="Dresses"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="50"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="1256"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-md font-semibold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-2">Delete Product</h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete "{products.find(p => p.id === deleteConfirm)?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-[#C62828] hover:bg-red-700 text-white rounded-md font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
