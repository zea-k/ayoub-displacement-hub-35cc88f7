import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package } from "lucide-react";
import type { POSProduct } from "./types";

interface Props {
  products: POSProduct[];
  onAddToCart: (product: POSProduct) => void;
  cartProductIds: Set<string>;
}

export default function POSProductGrid({ products, onAddToCart, cartProductIds }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) list = list.filter(p => p.category === activeCategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [products, activeCategory, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !activeCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 overflow-y-auto flex-1 content-start">
        {filtered.map(p => {
          const inCart = cartProductIds.has(p.id);
          const outOfStock = p.stock <= 0;
          return (
            <button
              key={p.id}
              onClick={() => !outOfStock && onAddToCart(p)}
              disabled={outOfStock}
className={`group relative flex flex-col items-center p-4 rounded-2xl border bg-card text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                outOfStock
                  ? 'opacity-50 cursor-not-allowed border-border'
                  : inCart
                    ? 'bg-gradient-to-br from-primary/10 to-amber-500/5 border-primary shadow-lg shadow-primary/10'
                    : 'border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
              }`}
            >
              <div className="group-hover:bg-gradient-to-br from-violet-500 to-amber-500/50 absolute -top-3 -right-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-amber-500/10 shadow-lg shadow-violet-500/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <Package className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/50 backdrop-blur-sm flex items-center justify-center mb-3 border border-border/50">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">{p.name}</span>
              <span className="text-sm font-bold text-primary mt-1">
                TZS {Number(p.selling_price).toLocaleString()}
              </span>
              <span className={`text-[10px] mt-0.5 ${outOfStock ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {outOfStock ? 'Out of stock' : `Stock: ${p.stock}`}
              </span>
              {inCart && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">✓</Badge>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12 text-sm">
            No products found
          </div>
        )}
      </div>
    </div>
  );
}
