import { motion } from "framer-motion";
import { MessageCircle, Send, ShoppingCart, Flame, Star, Zap, ImageOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoreSettings, PublicProduct } from "@/pages/PublicStorePage";

interface Props {
  products: PublicProduct[];
  store: StoreSettings;
  isDark: boolean;
  viewMode: "grid" | "list";
  onWhatsApp: (p: PublicProduct) => void;
  onAddToCart: (p: PublicProduct) => void;
  onViewProduct: (p: PublicProduct) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 25, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

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

export function PublicStoreProductGrid({ products, store, isDark, viewMode, onWhatsApp, onAddToCart, onViewProduct }: Props) {
  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className={`inline-flex h-24 w-24 items-center justify-center rounded-3xl mb-6 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
            <Eye className={`h-12 w-12 ${isDark ? "text-gray-800" : "text-gray-300"}`} />
          </div>
          <p className={`text-lg font-medium ${isDark ? "text-gray-500" : "text-gray-800"}`}>No products match your search</p>
          <p className={`mt-1 text-sm ${isDark ? "text-gray-800" : "text-gray-800"}`}>Try a different search term or category</p>
        </motion.div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <main className="container mx-auto px-4 py-4">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {products.map((p) => (
            <motion.article
              key={p.id}
              variants={item}
              className={`flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isDark ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]" : "border-gray-200/80 bg-white hover:shadow-gray-200/50"
              }`}
              onClick={() => onViewProduct(p)}
            >
              <div className="h-20 w-20 rounded-xl overflow-hidden shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className={`h-full w-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                    <ImageOff className={`h-8 w-8 ${isDark ? "text-gray-700" : "text-gray-200"}`} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold truncate">{p.name}</h3>
                    {p.category && (
                      <span className={`text-[10px] font-semibold uppercase ${isDark ? "text-gray-500" : "text-gray-800"}`}>{p.category}</span>
                    )}
                  </div>
                  <StockBadge stock={p.stock} isDark={isDark} />
                </div>
                {p.description && (
                  <p className={`text-xs line-clamp-1 mt-1 ${isDark ? "text-gray-500" : "text-gray-800"}`}>{p.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-heading text-lg font-extrabold" style={{ color: store.theme_color }}>
                    TZS {p.selling_price.toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    className="h-9 rounded-lg text-xs font-bold text-white border-0 active:scale-95 transition-all"
                    style={{ backgroundColor: store.theme_color }}
                    onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                  >
                    <ShoppingCart className="mr-1 h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-4">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {products.map((p) => (
          <motion.article
            key={p.id}
            variants={item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
              isDark
                ? "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                : "border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50"
            }`}
            onClick={() => onViewProduct(p)}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
              style={{ background: `radial-gradient(circle at 50% 0%, ${store.theme_color}12, transparent 70%)` }}
            />
            <div
              className="h-0.5 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `linear-gradient(90deg, transparent, ${store.theme_color}, transparent)` }}
            />

            {/* Image */}
            {p.image_url ? (
              <div className="relative aspect-square w-full overflow-hidden">
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-gray-950/60" : "from-white/30"} to-transparent`} />
                <div className="absolute top-2 right-2">
                  <StockBadge stock={p.stock} isDark={isDark} />
                </div>
              </div>
            ) : (
              <div className={`relative aspect-square w-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <ImageOff className={`h-10 w-10 ${isDark ? "text-gray-700" : "text-gray-200"}`} />
                <div className="absolute top-2 right-2">
                  <StockBadge stock={p.stock} isDark={isDark} />
                </div>
              </div>
            )}

            <div className="relative flex-1 p-2 sm:p-3 md:p-4">
              {p.category && (
                <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-700"}`}>
                  {p.category}
                </span>
              )}
              <h3 className="font-heading text-xs sm:text-sm md:text-base font-bold leading-tight line-clamp-2">{p.name}</h3>
              {p.description && (
                <p className={`mt-1 text-xs line-clamp-2 ${isDark ? "text-gray-500" : "text-gray-800"}`}>{p.description}</p>
              )}
              <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                <span className={`text-[9px] sm:text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-800"}`}>TZS</span>
                <span className="font-heading text-base sm:text-lg md:text-xl font-extrabold" style={{ color: store.theme_color }}>
                  {p.selling_price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className={`flex gap-2 p-2 md:p-2.5 border-t transition-colors ${isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50"}`}>
              <Button
                size="sm"
                className="flex-1 text-[11px] md:text-xs rounded-xl h-9 md:h-10 font-bold shadow-lg text-white border-0 transition-all hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: store.theme_color, boxShadow: `0 4px 15px -3px ${store.theme_color}55` }}
                onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
              >
                <ShoppingCart className="mr-1 h-4 w-4" /> Add to Cart
              </Button>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </main>
  );
}
