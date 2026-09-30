/**
 * Mock Cart Storage - Client-side cart for testing with mock plots
 * 
 * Simulates backend cart behavior for mock plots only.
 * Real plots still use the actual backend API.
 * 
 * Currency: Converts THB to USD (1 USD = 35 THB)
 */

import type { Cart, CartItem } from "./cart.schemas";

const MOCK_CART_KEY = "tajlandia_mock_cart";
const THB_TO_USD = 1 / 35; // Conversion rate: 1 USD = 35 THB

interface MockCartStorage {
  items: CartItem[];
  couponCode?: string;
  discount: number;
}

// ─── Get Mock Cart from localStorage ─────────────────────────────────────────

function getMockCartStorage(): MockCartStorage {
  if (typeof window === "undefined") return { items: [], discount: 0 };
  
  try {
    const stored = localStorage.getItem(MOCK_CART_KEY);
    if (!stored) return { items: [], discount: 0 };
    return JSON.parse(stored);
  } catch {
    return { items: [], discount: 0 };
  }
}

function saveMockCartStorage(cart: MockCartStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
}

// ─── Calculate Cart Totals ───────────────────────────────────────────────────

function calculateTotals(storage: MockCartStorage): Cart {
  const totalRai = storage.items.reduce((sum, item) => sum + item.sizeRai, 0);
  const subtotal = storage.items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - storage.discount;
  const minimumRai = 100;
  const remainingRai = Math.max(0, minimumRai - totalRai);
  const valid = totalRai >= minimumRai;
  
  return {
    items: storage.items,
    totalRai,
    subtotal,
    discount: storage.discount,
    total,
    minimumRai,
    remainingRai,
    valid,
    checkoutEligible: valid,
    couponCode: storage.couponCode,
    message: valid 
      ? "Cart meets minimum requirements" 
      : `Add ${remainingRai.toFixed(1)} more rai to checkout`,
  };
}

// ─── Mock Cart API Methods ───────────────────────────────────────────────────

export function getMockCart(): Cart {
  const storage = getMockCartStorage();
  return calculateTotals(storage);
}

export function addMockPlotToCart(
  plotId: string,
  sizeRai: number,
  pricePerRai: number,
  region?: string,
  city?: string,
  zone?: string,
  coordinates?: { latitude: number; longitude: number }
): Cart {
  const storage = getMockCartStorage();
  
  // Check if already in cart
  const existing = storage.items.find(item => item.plotId === plotId);
  if (existing) {
    throw new Error("Plot is already in cart");
  }
  
  // Convert THB to USD for display consistency
  const pricePerRaiUSD = pricePerRai * THB_TO_USD;
  const subtotalUSD = sizeRai * pricePerRaiUSD;
  
  // Add new item
  const newItem: CartItem = {
    plotId,
    sizeRai,
    pricePerRai: pricePerRaiUSD,
    subtotal: subtotalUSD,
    region,
    city,
    zone,
    coordinates,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };
  
  storage.items.push(newItem);
  saveMockCartStorage(storage);
  
  console.log(`[MockCart] Added plot ${plotId}: ${sizeRai} Rai @ $${pricePerRaiUSD.toFixed(2)}/Rai = $${subtotalUSD.toFixed(2)}`);
  
  return calculateTotals(storage);
}

export function removeMockPlotFromCart(plotId: string): Cart {
  const storage = getMockCartStorage();
  storage.items = storage.items.filter(item => item.plotId !== plotId);
  saveMockCartStorage(storage);
  
  return calculateTotals(storage);
}

export function clearMockCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOCK_CART_KEY);
}

export function isMockPlot(plotId: string): boolean {
  return plotId.startsWith("mock-");
}
