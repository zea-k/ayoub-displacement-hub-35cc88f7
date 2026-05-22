import { useState, useCallback, useMemo } from "react";
import type { CartItem, SaleDiscount } from "./types";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [saleDiscount, setSaleDiscount] = useState<SaleDiscount>({ type: 'none', value: 0, amount: 0 });

  const addItem = useCallback((product: { id: string; name: string; selling_price: number; buying_price: number; stock: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.productId === product.id ? recalcItem({ ...i, quantity: i.quantity + 1 }) : i);
      }
      if (product.stock <= 0) return prev;
      return [...prev, recalcItem({
        productId: product.id, name: product.name, unitPrice: product.selling_price,
        buyingPrice: product.buying_price, quantity: 1, stock: product.stock,
        discountType: 'none', discountValue: 0, discountAmount: 0, subtotal: 0, profit: 0,
      })];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    setItems(prev => {
      if (qty <= 0) return prev.filter(i => i.productId !== productId);
      return prev.map(i => i.productId === productId ? recalcItem({ ...i, quantity: Math.min(qty, i.stock) }) : i);
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const setItemDiscount = useCallback((productId: string, type: 'none' | 'percentage' | 'fixed', value: number) => {
    setItems(prev => prev.map(i => i.productId === productId ? recalcItem({ ...i, discountType: type, discountValue: value }) : i));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSaleDiscount({ type: 'none', value: 0, amount: 0 });
  }, []);

  const updateSaleDiscount = useCallback((type: 'none' | 'percentage' | 'fixed', value: number) => {
    setSaleDiscount({ type, value, amount: 0 }); // amount calculated in totals
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const totalItemDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
    let saleDiscountAmount = 0;
    if (saleDiscount.type === 'percentage') saleDiscountAmount = subtotal * saleDiscount.value / 100;
    else if (saleDiscount.type === 'fixed') saleDiscountAmount = saleDiscount.value;
    saleDiscountAmount = Math.min(saleDiscountAmount, subtotal);
    const finalTotal = Math.max(0, subtotal - saleDiscountAmount);
    const totalProfit = items.reduce((s, i) => s + i.profit, 0) - saleDiscountAmount;
    const discountWarning = subtotal > 0 && (totalItemDiscount + saleDiscountAmount) / (subtotal + totalItemDiscount) > 0.3;
    return { subtotal, totalItemDiscount, saleDiscountAmount, finalTotal, totalProfit, discountWarning };
  }, [items, saleDiscount]);

  return { items, saleDiscount, addItem, updateQuantity, removeItem, setItemDiscount, clearCart, updateSaleDiscount, totals };
}

function recalcItem(item: CartItem): CartItem {
  const gross = item.unitPrice * item.quantity;
  let discountAmount = 0;
  if (item.discountType === 'percentage') discountAmount = gross * item.discountValue / 100;
  else if (item.discountType === 'fixed') discountAmount = item.discountValue * item.quantity;
  discountAmount = Math.min(discountAmount, gross);
  const subtotal = gross - discountAmount;
  const profit = subtotal - item.buyingPrice * item.quantity;
  return { ...item, discountAmount, subtotal, profit };
}
