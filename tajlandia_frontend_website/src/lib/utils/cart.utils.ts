/**
 * Cart utilities for managing plot selections.
 * 
 * Currently uses localStorage for cart persistence.
 * TODO: Integrate with backend cart API when available.
 */

export type CartItem = {
  id: string;
  plotId: string;
  name: string;
  region?: string;
  city?: string;
  rai: number;
  pricePerRai: number;
  amount: number;
  image?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  addedAt: string;
};

const CART_KEY = "tajlandia_cart";

/**
 * Get all items in the cart
 */
export function getCartItems(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is CartItem => item && typeof item === "object")
      : [];
  } catch {
    return [];
  }
}

/**
 * Add a plot to the cart
 */
export function addToCart(item: Omit<CartItem, "addedAt">): boolean {
  try {
    const cart = getCartItems();
    
    // Check if plot already in cart
    if (cart.some((existing) => existing.plotId === item.plotId)) {
      console.warn("[Cart] Plot already in cart:", item.plotId);
      return false;
    }

    const newItem: CartItem = {
      ...item,
      addedAt: new Date().toISOString(),
    };

    cart.push(newItem);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: cart }));
    
    return true;
  } catch (error) {
    console.error("[Cart] Failed to add item:", error);
    return false;
  }
}

/**
 * Remove a plot from the cart
 */
export function removeFromCart(plotId: string): boolean {
  try {
    const cart = getCartItems();
    const filtered = cart.filter((item) => item.plotId !== plotId);
    
    if (filtered.length === cart.length) {
      console.warn("[Cart] Plot not found in cart:", plotId);
      return false;
    }

    localStorage.setItem(CART_KEY, JSON.stringify(filtered));
    
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: filtered }));
    
    return true;
  } catch (error) {
    console.error("[Cart] Failed to remove item:", error);
    return false;
  }
}

/**
 * Check if a plot is in the cart
 */
export function isInCart(plotId: string): boolean {
  const cart = getCartItems();
  return cart.some((item) => item.plotId === plotId);
}

/**
 * Get cart item count
 */
export function getCartCount(): number {
  return getCartItems().length;
}

/**
 * Get total rai in cart
 */
export function getTotalRai(): number {
  const cart = getCartItems();
  return cart.reduce((total, item) => total + item.rai, 0);
}

/**
 * Get total cart amount
 */
export function getTotalAmount(): number {
  const cart = getCartItems();
  return cart.reduce((total, item) => total + item.amount, 0);
}

/**
 * Clear the entire cart
 */
export function clearCart(): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: [] }));
  } catch (error) {
    console.error("[Cart] Failed to clear cart:", error);
  }
}
