import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ShopCard, { MarketplaceShop, ShopCardSkeleton } from "./ShopCard";

interface FeaturedShopsProps {
  shops: MarketplaceShop[];
  loading?: boolean;
  onShopClick: (shop: MarketplaceShop) => void;
}

/**
 * Premium horizontal scroll with center-snap + zoom effect.
 * - Center card scales 1.0
 * - Side cards scale 0.88
 * - Smooth scroll-snap, no scrollbar
 */
export default function FeaturedShops({ shops, loading, onShopClick }: FeaturedShopsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scales, setScales] = useState<number[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const items = Array.from(el.querySelectorAll<HTMLElement>("[data-snap-item]"));
      if (!items.length) return;
      const containerCenter = el.getBoundingClientRect().left + el.clientWidth / 2;
      const max = el.clientWidth / 2;
      const next = items.map((item) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - containerCenter);
        const ratio = Math.min(distance / max, 1);
        return 1 - ratio * 0.18;
      });
      // Avoid re-render if nothing changed meaningfully
      setScales((prev) => {
        if (prev.length === next.length && prev.every((v, i) => Math.abs(v - next[i]) < 0.01)) return prev;
        return next;
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [shops.length]);

  if (!loading && shops.length === 0) return null;

  return (
    <section className="px-4 pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t("market.featuredShops")}</h2>
          </div>
          <span className="text-xs sm:text-sm text-gray-500">
            {loading ? "" : `${shops.length} curated`}
          </span>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-4 px-4 pb-2"
          style={{ scrollPaddingInline: "20%" }}
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="snap-center">
                  <ShopCardSkeleton variant="horizontal" />
                </div>
              ))
            : shops.map((shop, i) => (
                <div
                  key={shop.owner_id}
                  data-snap-item
                  className="snap-center transition-transform duration-200 ease-out"
                  style={{ transform: `scale(${scales[i] ?? 1})`, transformOrigin: "center" }}
                >
                  <ShopCard shop={shop} featured variant="horizontal" onClick={() => onShopClick(shop)} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
