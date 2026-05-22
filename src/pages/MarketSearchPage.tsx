import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, Store, Package, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import MarketShell from "@/components/marketplace/MarketShell";
import { useActivityTracker } from "@/hooks/useActivityTracker";

interface ShopHit {
  owner_id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  category: string | null;
  theme_color: string;
  description: string | null;
}

interface ProductHit {
  id: string;
  name: string;
  selling_price: number;
  image_url: string | null;
  category: string | null;
  description: string | null;
  likes_count: number;
  owner_id: string;
  shop_slug?: string;
  shop_name?: string;
  shop_color?: string;
}

export default function MarketSearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [shops, setShops] = useState<ShopHit[]>([]);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const { track } = useActivityTracker();
  const { t } = useTranslation();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced) setParams({ q: debounced }, { replace: true });
    else setParams({}, { replace: true });
  }, [debounced, setParams]);

  useEffect(() => {
    const run = async () => {
      if (!debounced) {
        setShops([]);
        setProducts([]);
        return;
      }
      setLoading(true);

      const tokens = debounced.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
      const safe = debounced.replace(/[%_]/g, "");

      const shopOr = [
        `business_name.ilike.%${safe}%`,
        `description.ilike.%${safe}%`,
        `category.ilike.%${safe}%`,
        ...tokens.map((t) => `business_name.ilike.%${t}%`),
        ...tokens.map((t) => `description.ilike.%${t}%`),
      ].join(",");

      const productOr = [
        `name.ilike.%${safe}%`,
        `description.ilike.%${safe}%`,
        `category.ilike.%${safe}%`,
        ...tokens.map((t) => `name.ilike.%${t}%`),
        ...tokens.map((t) => `category.ilike.%${t}%`),
      ].join(",");

      const [shopsRes, productsRes, allShopsRes] = await Promise.all([
        supabase
          .from("public_settings")
          .select("owner_id, business_name, slug, logo_url, category, theme_color, description")
          .eq("is_public_enabled", true)
          .eq("is_listed", true)
          .or(shopOr)
          .limit(20),
        supabase
          .from("products")
          .select("id, name, selling_price, image_url, category, description, likes_count, owner_id")
          .eq("public_visible", true)
          .gt("stock", 0)
          .or(productOr)
          .limit(40),
        supabase
          .from("public_settings")
          .select("owner_id, business_name, slug, theme_color")
          .eq("is_public_enabled", true)
          .eq("is_listed", true),
      ]);

      const shopMap = new Map<string, any>((allShopsRes.data || []).map((s: any) => [s.owner_id as string, s]));

      const enriched = (productsRes.data || [])
        .map((p) => {
          const shop = shopMap.get(p.owner_id);
          return shop
            ? { ...p, shop_slug: shop.slug, shop_name: shop.business_name, shop_color: shop.theme_color }
            : null;
        })
        .filter(Boolean) as ProductHit[];

      // Surface shops whose products matched, even if shop name itself didn't
      const productOwnerIds = new Set(enriched.map((p) => p.owner_id));
      const directShopIds = new Set((shopsRes.data || []).map((s) => s.owner_id));
      const extraOwnerIds = [...productOwnerIds].filter((id) => !directShopIds.has(id));

      let extraShops: ShopHit[] = [];
      if (extraOwnerIds.length > 0) {
        const { data } = await supabase
          .from("public_settings")
          .select("owner_id, business_name, slug, logo_url, category, theme_color, description")
          .in("owner_id", extraOwnerIds);
        extraShops = (data as ShopHit[]) || [];
      }

      setShops([...((shopsRes.data as ShopHit[]) || []), ...extraShops]);
      setProducts(enriched);
      setLoading(false);
    };

    run();
  }, [debounced]);

  const totalHits = shops.length + products.length;

  return (
    <MarketShell active="discover">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("market.searchTitle")}
              className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 border-white/10 text-white text-base placeholder:text-gray-500 focus-visible:ring-violet-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {debounced && !loading && (
            <p className="text-center text-gray-500 text-sm mt-3">
              {t(totalHits === 1 ? "market.resultFor" : "market.resultsFor", { count: totalHits, q: debounced })}
            </p>
          )}
        </div>

        {!debounced && (
          <div className="text-center py-20">
            <SearchIcon className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t("market.startTyping")}</p>
            <p className="text-gray-600 text-sm mt-1">{t("market.startTypingHint")}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-8">
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 w-56 rounded-3xl bg-white/5 animate-pulse shrink-0" />
              ))}
            </div>
          </div>
        )}

        {debounced && !loading && totalHits === 0 && (
          <div className="text-center py-20">
            <Package className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t("market.noMatches")}</p>
            <p className="text-gray-600 text-sm mt-1">{t("market.noMatchesHint")}</p>
          </div>
        )}

        {debounced && !loading && (
          <div className="space-y-12">
            {/* Products — featured-style horizontal cards */}
            {products.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-400" /> {t("market.products")} ({products.length})
                </h2>
                <div className="-mx-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 px-4 scrollbar-hide">
                  <div className="inline-flex gap-4">
                    {products.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="snap-center min-w-[230px] shrink-0 md:min-w-[260px]"
                      >
                        <Link
                          to={`/market/shop/${p.shop_slug}`}
                          onClick={() => track("view_product", p.id, p.category || "")}
                          className="group block rounded-3xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/20 transition-all"
                        >
                          <div className="aspect-square bg-white/5 overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-10 w-10 text-gray-700" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-white truncate">{p.name}</h3>
                            <p className="text-amber-300 font-bold mt-1">TZS {p.selling_price.toLocaleString()}</p>
                            {p.shop_name && (
                              <p className="text-[11px] text-gray-500 mt-2 truncate flex items-center gap-1">
                                <Store className="h-3 w-3" /> {p.shop_name}
                              </p>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Shops */}
            {shops.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Store className="h-5 w-5 text-violet-400" /> {t("market.relatedShops")} ({shops.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shops.map((s, i) => (
                    <motion.div key={s.owner_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Link
                        to={`/market/shop/${s.slug}`}
                        onClick={() => track("click_shop", s.slug, s.category || "")}
                        className="block rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.06] hover:border-white/10 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden"
                            style={{ backgroundColor: s.theme_color + "30" }}
                          >
                            {s.logo_url ? (
                              <img src={s.logo_url} alt={s.business_name} className="h-full w-full object-cover rounded-xl" />
                            ) : (
                              <span style={{ color: s.theme_color }}>{s.business_name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white truncate">{s.business_name}</h3>
                            {s.category && <p className="text-xs text-gray-500 mt-0.5">{s.category}</p>}
                            {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </MarketShell>
  );
}
