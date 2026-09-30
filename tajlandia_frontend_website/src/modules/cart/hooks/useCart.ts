/**
 * useCart hook
 *
 * Manages shopping cart state, syncing with backend API.
 * Provides cart items, totals, and actions for modify/checkout.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { isBrowserApiError } from "@/lib/api/client.browser";
import type { Cart, CartItem } from "@/lib/api/cart.schemas";
import {
  addItemToCart,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
  validateCart,
  applyCoupon,
  removeCoupon,
  checkoutCart,
} from "@/lib/api/cart.service";

export type UseCartState = {
  // Data
  items: CartItem[];
  totalRai: number;
  totalPrice: number;
  minimumRai: number;
  remainingRai: number;
  minimumReached: boolean;
  discount: number;
  couponCode: string | null;

  // Loading states
  isLoading: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  isClearing: boolean;
  isValidating: boolean;
  isCheckingOut: boolean;

  // Error
  error: string | null;

  // Actions
  refreshCart: () => Promise<void>;
  addItem: (plotId: string) => Promise<boolean>;
  removeItem: (plotId: string) => Promise<boolean>;
  updateItemQuantity: (plotId: string, rai: number) => Promise<boolean>;
  clearAllItems: () => Promise<boolean>;
  validateCartForCheckout: () => Promise<boolean>;
  applyCouponCode: (code: string) => Promise<boolean>;
  removeCouponCode: () => Promise<boolean>;
  checkout: () => Promise<string | null>; // Returns orderId or null
};

export function useCart(): UseCartState {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    let mounted = true;

    fetchCart()
      .then((data) => {
        if (!mounted) return;
        setCart(data);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          isBrowserApiError(err) ? err.message : "Failed to load cart",
        );
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Refresh cart
  const refreshCart = useCallback(async () => {
    try {
      const data = await fetchCart();
      setCart(data);
      setError(null);
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to refresh cart",
      );
    }
  }, []);

  // Add item
  const addItem = useCallback(async (plotId: string): Promise<boolean> => {
    setIsAdding(true);
    setError(null);

    try {
      const updatedCart = await addItemToCart(plotId);
      setCart(updatedCart);
      return true;
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to add item to cart",
      );
      return false;
    } finally {
      setIsAdding(false);
    }
  }, []);

  // Remove item
  const removeItem = useCallback(async (plotId: string): Promise<boolean> => {
    setIsRemoving(true);
    setError(null);

    try {
      await removeCartItem(plotId);
      // Refresh cart after removal
      await refreshCart();
      return true;
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to remove item",
      );
      return false;
    } finally {
      setIsRemoving(false);
    }
  }, [refreshCart]);

  // Update item quantity
  const updateItemQuantity = useCallback(
    async (plotId: string, rai: number): Promise<boolean> => {
      setError(null);

      try {
        const updatedCart = await updateCartItem(plotId, rai);
        setCart(updatedCart);
        return true;
      } catch (err) {
        setError(
          isBrowserApiError(err) ? err.message : "Failed to update quantity",
        );
        return false;
      }
    },
    [],
  );

  // Clear all items
  const clearAllItems = useCallback(async (): Promise<boolean> => {
    setIsClearing(true);
    setError(null);

    try {
      await clearCart();
      // Set empty cart state
      setCart({
        items: [],
        totalRai: 0,
        subtotal: 0,
        total: 0,
        minimumRai: 100,
        remainingRai: 100,
        valid: false,
        checkoutEligible: false,
        discount: 0,
      });
      return true;
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to clear cart",
      );
      return false;
    } finally {
      setIsClearing(false);
    }
  }, []);

  // Validate cart
  const validateCartForCheckout = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    setError(null);

    try {
      const validation = await validateCart();
      if (!validation.valid) {
        setError(validation.issues?.join(", ") || "Cart validation failed");
        return false;
      }
      return true;
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to validate cart",
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Apply coupon
  const applyCouponCode = useCallback(async (code: string): Promise<boolean> => {
    setError(null);

    try {
      await applyCoupon(code);
      // Refresh cart to get updated prices with discount
      await refreshCart();
      return true;
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to apply coupon",
      );
      return false;
    }
  }, [refreshCart]);

  // Remove coupon
  const removeCouponCode = useCallback(async (): Promise<boolean> => {
    setError(null);

    try {
      await removeCoupon();
      // Refresh cart to get updated prices without discount
      await refreshCart();
      return true;
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to remove coupon",
      );
      return false;
    }
  }, [refreshCart]);

  // Checkout
  const checkout = useCallback(async (): Promise<string | null> => {
    setIsCheckingOut(true);
    setError(null);

    try {
      const result = await checkoutCart();
      // Clear cart state after successful checkout
      setCart({
        items: [],
        totalRai: 0,
        subtotal: 0,
        total: 0,
        minimumRai: 100,
        remainingRai: 100,
        valid: false,
        checkoutEligible: false,
        discount: 0,
      });
      return result.orderId ?? null;
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to checkout",
      );
      return null;
    } finally {
      setIsCheckingOut(false);
    }
  }, []);

  return {
    // Data
    items: cart?.items || [],
    totalRai: cart?.totalRai || 0,
    totalPrice: cart?.total || 0,              // backend: total
    minimumRai: cart?.minimumRai || 100,
    remainingRai: cart?.remainingRai || 100,
    minimumReached: cart?.valid || false,       // backend: valid
    discount: cart?.discount || 0,
    couponCode: cart?.couponCode ?? null,

    // Loading states
    isLoading,
    isAdding,
    isRemoving,
    isClearing,
    isValidating,
    isCheckingOut,

    // Error
    error,

    // Actions
    refreshCart,
    addItem,
    removeItem,
    updateItemQuantity,
    clearAllItems,
    validateCartForCheckout,
    applyCouponCode,
    removeCouponCode,
    checkout,
  };
}
