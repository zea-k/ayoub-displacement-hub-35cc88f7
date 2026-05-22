import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingCart, Send, ImageOff, Star, Flame, Zap, Shield, Truck, Package } from "lucide-react";
import type { StoreSettings, PublicProduct } from "@/pages/PublicStorePage";

interface Props {
  product: PublicProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreSettings;
  isDark: boolean;
  onAddToCart: (p: PublicProduct) => void;
  onWhatsApp: (p: PublicProduct) => void;
  onOrderNow: (p: PublicProduct) => void;
}

function StockIndicator({ stock, isDark }: { stock: number; isDark: boolean }) {
  if (stock <= 3)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
        <Flame className="h-3.5 w-3.5" /> Only {stock} left — order now!
      </span>
    );
  if (stock <= 10)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <Zap className="h-3.5 w-3.5" /> Low stock — {stock} remaining
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
      <Star className="h-3.5 w-3.5" /> In stock
    </span>
  );
}

export function PublicStoreProductDetail({ product, open, onOpenChange, store, isDark, onAddToCart, onWhatsApp, onOrderNow }: Props) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-[95vw] sm:max-w-2xl p-0 rounded-2xl border-0 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#12121a] text-gray-100" : "bg-white"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className={`relative aspect-[4/3] md:aspect-auto md:min-h-[400px] ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ImageOff className={`h-20 w-20 ${isDark ? "text-gray-700" : "text-gray-200"}`} />
              </div>
            )}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(to top, ${isDark ? "#12121a" : "#ffffff"}33, transparent 50%)` }}
            />
            {product.category && (
              <span
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: `${store.theme_color}cc` }}
              >
                {product.category}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="p-4 sm:p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="font-heading text-xl sm:text-2xl font-bold">{product.name}</h2>
              <div className="mt-3">
                <StockIndicator stock={product.stock} isDark={isDark} />
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-800"}`}>TZS</span>
                <span className="font-heading text-4xl font-extrabold" style={{ color: store.theme_color }}>
                  {product.selling_price.toLocaleString()}
                </span>
              </div>

              {product.description && (
                <p className={`mt-4 text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                  {product.description}
                </p>
              )}

              {/* Trust badges */}
              <div className={`mt-6 grid grid-cols-3 gap-2`}>
                {[
                  { icon: Shield, label: "Secure" },
                  { icon: Truck, label: "Fast Delivery" },
                  { icon: Package, label: "Quality" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-center ${
                      isDark ? "bg-white/5 border border-white/5" : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" style={{ color: store.theme_color }} />
                    <span className={`text-[10px] font-semibold ${isDark ? "text-gray-500" : "text-gray-800"}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 sm:mt-6 space-y-2.5">
              <Button
                className="w-full h-12 sm:h-13 rounded-xl font-bold text-sm sm:text-base text-white border-0 transition-all hover:scale-[1.01] active:scale-95"
                style={{
                  backgroundColor: store.theme_color,
                  boxShadow: `0 6px 25px -5px ${store.theme_color}55`,
                }}
                onClick={() => { onAddToCart(product); onOpenChange(false); }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`flex-1 h-11 rounded-xl text-sm font-semibold ${isDark ? "border-white/10 hover:bg-white/5" : ""}`}
                  onClick={() => { onOrderNow(product); onOpenChange(false); }}
                >
                  <Send className="mr-1.5 h-4 w-4" /> Order Now
                </Button>
                {store.whatsapp_number && (
                  <Button
                    variant="outline"
                    className={`flex-1 h-11 rounded-xl text-sm font-semibold ${isDark ? "border-white/10 hover:bg-green-500/10 hover:text-green-400" : "hover:bg-green-50 hover:text-green-600"}`}
                    onClick={() => onWhatsApp(product)}
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
