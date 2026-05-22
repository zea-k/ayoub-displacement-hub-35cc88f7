import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import FeaturedShops from "@/components/marketplace/FeaturedShops";
import ShopList from "@/components/marketplace/ShopList";
import type { MarketplaceShop } from "@/components/marketplace/ShopCard";
import MarketShell from "@/components/marketplace/MarketShell";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

// Module-level cache so navigating away and back is instant
let _cache: { shops: MarketplaceShop[]; categories: CategoryRow[]; ts: number } | null = null;
const CACHE_TTL = 60_000; // 1 min

export default function MarketplacePage() {
  const [shops, setShops] = useState<MarketplaceShop[]>(() => _cache?.shops || []);
  const [categories, setCategories] = useState<CategoryRow[]>(() => _cache?.categories || []);
  const [loading, setLoading] = useState(() => !_cache);
  const [searchQuery, setSearchQuery] = useState("");
  const { track } = useActivityTracker();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fresh = _cache && Date.now() - _cache.ts < CACHE_TTL;
    if (fresh) return;

    const fetchData = async () => {
      const [shopRes, catRes] = await Promise.all([
        (supabase as any)
          .from("public_settings")
          .select(
            "owner_id, business_name, slug, logo_url, description, category, category_id, theme_color, is_featured, follower_count, engagement_score"
          )
          .eq("is_public_enabled", true)
          .eq("is_listed", true)
          .order("engagement_score", { ascending: false })
          .limit(120),
        (supabase as any).from("categories").select("id, name, slug").order("sort_order"),
      ]);

      const nextShops = (shopRes.data as MarketplaceShop[]) || [];
      const nextCats = (catRes.data as CategoryRow[]) || [];
      setCategories(nextCats);
      setShops(nextShops);
      _cache = { shops: nextShops, categories: nextCats, ts: Date.now() };
      setLoading(false);
    };
    fetchData();
  }, []);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const shopsWithCategory = useMemo(
    () =>
      shops.map((shop) => ({
        ...shop,
        category_name:
          (shop.category_id && categoriesById.get(shop.category_id)) ||
          shop.category ||
          t("market.other"),
      })),
    [shops, categoriesById]
  );

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shopsWithCategory;
    const q = searchQuery.toLowerCase();
    return shopsWithCategory.filter(
      (s) =>
        s.business_name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category_name?.toLowerCase().includes(q)
    );
  }, [shopsWithCategory, searchQuery]);

  const featuredShops = useMemo(
    () => shopsWithCategory.filter((s) => s.is_featured).slice(0, 12),
    [shopsWithCategory]
  );

  // Group all shops by category
  const grouped = useMemo(() => {
    const map = new Map<string, MarketplaceShop[]>();
    for (const shop of filteredShops) {
      const key = shop.category_name || t("market.other");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(shop);
    }
    // Order: keep DB category order, then anything else alphabetical
    const ordered: { name: string; shops: MarketplaceShop[] }[] = [];
    for (const c of categories) {
      const list = map.get(c.name);
      if (list && list.length) {
        ordered.push({ name: c.name, shops: list });
        map.delete(c.name);
      }
    }
    for (const [name, list] of [...map.entries()].sort()) {
      ordered.push({ name, shops: list });
    }
    return ordered;
  }, [filteredShops, categories]);

  const handleShopClick = (shop: MarketplaceShop) => {
    track("click_shop", shop.slug, shop.category_name || "");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/market/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <MarketShell active="shops">
      {/* Premium Apple-style hero with dashboard palette (primary + accent) */}
      <section className="relative overflow-hidden px-4 pt-16 sm:pt-24 pb-20 sm:pb-28 text-center apple-surface">
        {/* Ambient color washes echoing dashboard theme */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/25 blur-[120px]" />
          <div className="absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-accent/20 blur-[110px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[260px] w-[640px] rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/70 border border-primary/30 text-primary text-xs sm:text-sm font-semibold mb-7 backdrop-blur-md shadow-sm">
            <Sparkles className="h-4 w-4" />
            {t("market.trustedMarketplace")}
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl font-bold mb-5 leading-[1.05] tracking-tight text-foreground text-balance-heading">
            {t("market.buyFromTrusted").split(" ").slice(0, -1).join(" ")}{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              {t("market.buyFromTrusted").split(" ").slice(-1)}
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("market.buyFromTrustedSub")}
          </p>

          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative mb-3">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 opacity-60 blur-md" />
            <div className="relative rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("market.searchPlaceholder")}
                className="pl-14 h-14 rounded-2xl bg-transparent border-0 text-foreground placeholder:text-muted-foreground text-base focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          </form>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("market.pressEnterFullSearch")}</p>
        </div>
      </section>

      <FeaturedShops shops={featuredShops} loading={loading} onShopClick={handleShopClick} />

      {loading ? (
        <ShopList loading={true} shops={[]} count={0} title={t("market.loadingShops")} onShopClick={handleShopClick} />
      ) : grouped.length === 0 ? (
        <ShopList loading={false} shops={[]} count={0} title={t("market.noShopsFound")} onShopClick={handleShopClick} />
      ) : (
        <div className="space-y-2">
          {grouped.map((g, idx) => (
            <ShopList
              key={g.name}
              loading={false}
              shops={g.shops}
              count={g.shops.length}
              title={g.name}
              onShopClick={handleShopClick}
              layout={idx === grouped.length - 1 ? "grid" : "horizontal"}
            />
          ))}
        </div>
      )}
    </MarketShell>
  );
}
