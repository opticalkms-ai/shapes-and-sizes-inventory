import React, { useDeferredValue, useMemo, useState } from "react";
import { Minus, Package, Plus, Receipt, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

interface CartItem {
  productId: string;
  quantity: number;
}

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export function POS() {
  const { products, checkoutSale, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [gcashReference, setGcashReference] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    transactionId: string;
    totalAmount: number;
    date: string;
    paymentMethod: "cash" | "gcash";
  } | null>(null);
  const deferredSearch = useDeferredValue(search);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(product => product.category).filter(Boolean));
    return Array.from(uniqueCategories).sort();
  }, [products]);

  const availableProducts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return products
      .filter(product => product.quantity > 0)
      .filter(product => {
        if (categoryFilter !== "all" && product.category !== categoryFilter) {
          return false;
        }

        if (!query) return true;

        return (
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.sku || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, categoryFilter, deferredSearch]);

  const cartDetails = useMemo(() => {
    return cart
      .map(item => {
        const product = products.find(entry => entry.id === item.productId);
        if (!product) return null;

        return {
          ...item,
          product,
          lineTotal: product.price * item.quantity,
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      quantity: number;
      product: (typeof products)[number];
      lineTotal: number;
    }>;
  }, [cart, products]);

  const totalItems = cartDetails.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartDetails.reduce((sum, item) => sum + item.lineTotal, 0);
  const cashValue = Number.parseFloat(cashReceived);
  const hasValidCash = !Number.isNaN(cashValue) && cashValue >= subtotal;
  const hasValidGcash = paymentMethod === "gcash" ? gcashReference.trim().length > 0 : true;
  const change = paymentMethod === "cash" && hasValidCash ? cashValue - subtotal : 0;
  const paymentValid = paymentMethod === "cash" ? hasValidCash : hasValidGcash;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const addToCart = (productId: string) => {
    const product = products.find(entry => entry.id === productId);
    if (!product) return;

    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (!existing) {
        return [...prev, { productId, quantity: 1 }];
      }

      if (existing.quantity >= product.quantity) {
        toast.error(`Only ${product.quantity} item(s) available for ${product.name}.`);
        return prev;
      }

      return prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  };

  const updateCartQuantity = (productId: string, nextQuantity: number) => {
    const product = products.find(entry => entry.id === productId);
    if (!product) return;

    if (nextQuantity <= 0) {
      setCart(prev => prev.filter(item => item.productId !== productId));
      return;
    }

    if (nextQuantity > product.quantity) {
      toast.error(`Only ${product.quantity} item(s) available for ${product.name}.`);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCheckout = () => {
    if (cartDetails.length === 0) {
      toast.error("Add at least one product to the cart.");
      return;
    }

    if (!paymentValid) {
      if (paymentMethod === "cash") {
        toast.error("Cash received must cover the full total.");
      } else {
        toast.error("Enter a valid GCash reference to complete payment.");
      }
      return;
    }

    setProcessing(true);

    const result = checkoutSale(
      cartDetails.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );

    setProcessing(false);

    if (!result.success || !result.transactionId || typeof result.totalAmount !== "number") {
      toast.error(result.message);
      return;
    }

    setLastTransaction({
      transactionId: result.transactionId,
      totalAmount: result.totalAmount,
      date: result.date ?? new Date().toISOString(),
      paymentMethod,
    });
    setCart([]);
    setCashReceived("");
    setGcashReference("");
    toast.success(`Checkout complete: ${result.transactionId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-sm text-gray-500">
            Process walk-in purchases and update stock in real time.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="text-xs uppercase tracking-wide text-gray-400">Cashier</div>
          <div className="font-semibold text-gray-900">
            {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Not signed in"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.95fr)]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search by product, SKU, or category"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={event => setCategoryFilter(event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
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

          {availableProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <Package size={42} className="mx-auto mb-3 text-gray-300" />
              <h2 className="text-base font-semibold text-gray-700">No sellable products found</h2>
              <p className="mt-1 text-sm text-gray-400">
                Add stock in Inventory or change your filters to begin selling.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {availableProducts.map(product => {
                const itemInCart = cart.find(item => item.productId === product.id);
                return (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-gray-900">{product.name}</h2>
                        <p className="text-xs text-gray-500">
                          {product.category}
                          {product.sku ? ` • ${product.sku}` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.quantity <= 5
                            ? "bg-orange-100 text-orange-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {product.quantity} in stock
                      </span>
                    </div>

                    <div className="mb-4 text-2xl font-bold text-[#C2185B]">
                      {pesoFormatter.format(product.price)}
                    </div>

                    {itemInCart ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(product.id, itemInCart.quantity - 1)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-gray-900">
                            {itemInCart.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(product.id, itemInCart.quantity + 1)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C2185B] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9D1050]"
                      >
                        <Plus size={16} />
                        Add to Cart
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#C2185B]" />
                  <h2 className="font-semibold text-gray-900">Current Cart</h2>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="max-h-[380px] space-y-3 overflow-y-auto px-5 py-4">
              {cartDetails.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center">
                  <Receipt size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No items in cart</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Add products from the left to begin a transaction.
                  </p>
                </div>
              ) : (
                cartDetails.map(item => (
                  <div key={item.productId} className="rounded-xl border border-gray-200 p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-xs text-gray-500">{item.product.category}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {pesoFormatter.format(item.product.price)} each
                        </div>
                        <div className="font-semibold text-[#C2185B]">
                          {pesoFormatter.format(item.lineTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 px-5 py-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{pesoFormatter.format(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{pesoFormatter.format(subtotal)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <label className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="h-4 w-4 text-[#C2185B]"
                    />
                    Cash
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "gcash"}
                      onChange={() => setPaymentMethod("gcash")}
                      className="h-4 w-4 text-[#C2185B]"
                    />
                    GCash
                  </label>
                </div>

                {paymentMethod === "cash" ? (
                  <>
                    <label className="block text-sm font-semibold text-gray-800">Cash Received</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashReceived}
                      onChange={event => setCashReceived(event.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Change</span>
                      <span className={`font-semibold ${hasValidCash ? "text-emerald-600" : "text-gray-400"}`}>
                        {pesoFormatter.format(change)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-gray-800">GCash Reference</label>
                    <input
                      type="text"
                      value={gcashReference}
                      onChange={event => setGcashReference(event.target.value)}
                      placeholder="Enter transaction reference"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                    />
                    <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
                      Please collect payment through GCash and confirm the transaction reference before checkout.
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    setCart([]);
                    setCashReceived("");
                  }}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processing || cartDetails.length === 0}
                  className="flex-1 rounded-xl bg-[#C2185B] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9D1050] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Checkout"}
                </button>
              </div>
            </div>
          </div>

          {lastTransaction && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Last Transaction
              </div>
              <div className="text-sm font-semibold text-emerald-900">{lastTransaction.transactionId}</div>
              <div className="mt-1 text-sm text-emerald-800">
                Total: {pesoFormatter.format(lastTransaction.totalAmount)}
              </div>
              <div className="mt-1 text-sm text-gray-700">
                Payment: {lastTransaction.paymentMethod === "cash" ? "Cash" : "GCash"}
              </div>
              <div className="mt-1 text-sm text-gray-700">
                Purchased at: {formatDate(lastTransaction.date)}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
