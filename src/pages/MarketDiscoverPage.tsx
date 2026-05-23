import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Sparkles } from "lucide-react";
import MarketShell from "@/components/marketplace/MarketShell";
import ProductFeed, { DiscoverProduct } from "@/components/marketplace/ProductFeed";
import { useAuth } from "@/contexts/AuthContext";

export default function MarketDiscoverPage() {
  const [feed, setFeed] = useState<DiscoverProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>("loading");
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const buildFeed = (products: any[], shopMap: Map<string, any>, orderedIds: string[]) => {
      const byId = new Map(products.map((p) => [p.id, p]));
      const ranked = orderedIds.length
        ? orderedIds.map((id) => byId.get(id)).filter(Boolean)
        : [...products];
      const seen = new Set(ranked.map((p: any) => p.id));
      for (const p of products) if (!seen.has(p.id)) ranked.push(p);
      return ranked
        .map((product: any) => {
          const shop = shopMap.get(product.owner_id);
          return {
            ...product,
            shop_slug: shop?.slug,
            shop_name: shop?.business_name,
            shop_color: shop?.theme_color,
          };
        })
        .filter((item: any) => item.shop_slug);
    };

    const load = async () => {
      setLoading(true);

      // Fetch products and shops in parallel — show as soon as they arrive.
      const [{ data: products }, { data: shops }] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, selling_price, image_url, category, description, likes_count, comments_count, saves_count, owner_id, created_at"
          )
          .eq("public_visible", true)
          .gt("stock", 0)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("public_settings")
          .select("owner_id, business_name, slug, theme_color")
          .eq("is_public_enabled", true)
          .eq("is_listed", true),
      ]);

      if (cancelled) return;
      const shopMap = new Map<string, any>((shops || []).map((s: any) => [s.owner_id as string, s]));
      const baseProducts = products || [];

      // Render immediately with default order so users never wait on AI.
      setFeed(buildFeed(baseProducts, shopMap, []));
      setLoading(false);

      // Personalize in the background and re-rank when ready (no flicker).
      try {
        const { data, error } = await supabase.functions.invoke("personalized-discover");
        if (cancelled || error || !data?.orderedProductIds) return;
        setMode(data.mode || "personalized");
        setFeed(buildFeed(baseProducts, shopMap, data.orderedProductIds));
      } catch (e) {
        console.warn("Discover personalization failed, keeping default order", e);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const personalizedLabel = user
    ? mode === "ai"
      ? t("market.aiPersonalized")
      : t("market.personalized")
    : t("market.trendingNow");

  return (
    <MarketShell active="discover">
      <div className="relative apple-surface">
        {/* Compact ambient washes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -left-12 h-[280px] w-[280px] rounded-full bg-primary/15 blur-[90px]" />
          <div className="absolute top-8 right-0 h-[200px] w-[200px] rounded-full bg-accent/12 blur-[70px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-6 sm:pt-8 scroll-smooth">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mb-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/70 border border-primary/30 text-primary text-xs font-semibold mb-3 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {personalizedLabel}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2 leading-tight tracking-tight text-foreground text-balance-heading">
              {t("market.discoverTitle")}{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {t("market.discoverTitleAccent")}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              {user ? t("market.discoverSubtitleSignedIn") : t("market.discoverSubtitleGuest")}
            </p>
          </motion.div>

          <ProductFeed products={feed} loading={loading} />
        </div>
      </div>
    </MarketShell>
  );
}
