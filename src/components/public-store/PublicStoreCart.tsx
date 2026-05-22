import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoreSettings, PublicProduct } from "@/pages/PublicStorePage";

export interface CartItem {
  product: PublicProduct;
  quantity: number;
}

interface Props {
  items: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  store: StoreSettings;
  isDark: boolean;
}

export function PublicStoreCartButton({
  itemCount,
  onClick,
  store,
}: {
  itemCount: number;
  onClick: () => void;
  store: StoreSettings;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all hover:scale-105"
      style={{
        backgroundColor: store.theme_color,
        boxShadow: `0 8px 30px -4px ${store.theme_color}66`,
      }}
    >
      <ShoppingCart className="h-6 w-6" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-lg"
          >
            {itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function PublicStoreCartDrawer({ items, onUpdateQuantity, onRemove, onCheckout, store, isDark }: Props) {
  const total = items.reduce((s, i) => s + i.product.selling_price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${store.theme_color}, ${store.theme_color}cc)` }}
          >
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold">Your Cart</h3>
            <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <ShoppingCart className={`h-16 w-16 mb-4 ${isDark ? "text-gray-700" : "text-gray-200"}`} />
              <p className={`font-medium ${isDark ? "text-gray-500" : "text-gray-600"}`}>Your cart is empty</p>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-600" : "text-gray-300"}`}>Add some products to get started</p>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30, height: 0 }}
                className={`flex gap-3 p-3 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-100"}`}
              >
                {/* Thumbnail */}
                <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                      <ImageOff className="h-5 w-5 opacity-30" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">{item.product.name}</h4>
                  <p className="text-xs font-bold mt-0.5" style={{ color: store.theme_color }}>
                    TZS {item.product.selling_price.toLocaleString()}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className={`flex items-center rounded-lg overflow-hidden ${isDark ? "bg-white/10" : "bg-white border border-gray-200"}`}>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className={`p-1.5 transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                        className={`p-1.5 transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemove(item.product.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">
                    TZS {(item.product.selling_price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className={`p-5 border-t space-y-4 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50"}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total</span>
            <span className="font-heading text-2xl font-extrabold" style={{ color: store.theme_color }}>
              TZS {total.toLocaleString()}
            </span>
          </div>
          <Button
            onClick={onCheckout}
            className="w-full h-12 rounded-xl font-bold text-base text-white border-0 transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: store.theme_color,
              boxShadow: `0 8px 30px -6px ${store.theme_color}55`,
            }}
          >
            Checkout <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
