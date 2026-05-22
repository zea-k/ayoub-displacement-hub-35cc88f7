import { motion } from "framer-motion";
import { Crown, ShoppingCart, ImageOff, Flame, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoreSettings, PublicProduct } from "@/pages/PublicStorePage";

interface Props {
  products: PublicProduct[];
  store: StoreSettings;
  isDark: boolean;
  onAddToCart: (p: PublicProduct) => void;
  onViewProduct: (p: PublicProduct) => void;
}

function StockBadge({ stock, isDark }: { stock: number; isDark: boolean }) {
  if (stock <= 3)
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
        <Flame className="h-3 w-3" /> {stock} left
      </span>
    );
  if (stock <= 10)
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
        <Zap className="h-3 w-3" /> Low stock
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
      <Star className="h-3 w-3" /> In stock
    </span>
  );
}

export function PublicStoreFeatured({ products, store, isDark, onAddToCart, onViewProduct }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${store.theme_color}, ${store.theme_color}cc)` }}
        >
          <Crown className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold">Featured Products</h2>
          <p className={`text-[11px] sm:text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>
            Handpicked for you
          </p>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 snap-x snap-mandatory">
        {products.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`shrink-0 w-[200px] sm:w-[220px] md:w-[240px] snap-start rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 group ${
              isDark
                ? "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                : "border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50"
            }`}
            onClick={() => onViewProduct(p)}
          >
            {/* Featured badge */}
            <div
              className="absolute z-10 top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white flex items-center gap-1"
              style={{ backgroundColor: `${store.theme_color}dd` }}
            >
              <Crown className="h-2.5 w-2.5" /> Featured
            </div>

            {/* Image */}
            <div className="relative aspect-square overflow-hidden">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className={`h-full w-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                  <ImageOff className={`h-10 w-10 ${isDark ? "text-gray-700" : "text-gray-200"}`} />
                </div>
              )}
              <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-gray-950/60" : "from-white/30"} to-transparent`} />
              <div className="absolute top-2 right-2">
                <StockBadge stock={p.stock} isDark={isDark} />
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-heading text-sm font-bold leading-tight line-clamp-1">{p.name}</h3>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className={`text-[9px] font-medium ${isDark ? "text-gray-500" : "text-gray-600"}`}>TZS</span>
                <span className="font-heading text-base font-extrabold" style={{ color: store.theme_color }}>
                  {p.selling_price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className={`p-2 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
              <Button
                size="sm"
                className="w-full text-[11px] rounded-xl h-9 font-bold shadow-lg text-white border-0 active:scale-95 transition-all"
                style={{ backgroundColor: store.theme_color, boxShadow: `0 4px 15px -3px ${store.theme_color}55` }}
                onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
              >
                <ShoppingCart className="mr-1 h-4 w-4" /> Add to Cart
              </Button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
