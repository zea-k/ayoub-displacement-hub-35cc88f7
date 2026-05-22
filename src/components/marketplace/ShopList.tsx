import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import ShopCard, { MarketplaceShop, ShopCardSkeleton } from "./ShopCard";

interface ShopListProps {
  shops: MarketplaceShop[];
  loading: boolean;
  title: string;
  count: number;
  onShopClick: (shop: MarketplaceShop) => void;
  /**
   * "grid" → uniform responsive grid (default).
   * "horizontal" → horizontal scroll row (e.g. category sections).
   */
  layout?: "grid" | "horizontal";
}

export default function ShopList({
  shops,
  loading,
  title,
  count,
  onShopClick,
  layout = "grid",
}: ShopListProps) {
  const { t } = useTranslation();
  return (
    <section className="px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          <span className="text-xs sm:text-sm text-gray-500">
            {loading ? "" : `${count} ${t("market.shopsCountSuffix")}`}
          </span>
        </div>

        {loading ? (
          layout === "horizontal" ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <ShopCardSkeleton key={i} variant="horizontal" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ShopCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : shops.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-gray-200 bg-gray-50">
            <Store className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700">{t("market.noShopsFound")}</p>
            <p className="text-gray-500 text-xs mt-1">{t("market.noShopsHint")}</p>
          </div>
        ) : layout === "horizontal" ? (
          <div className="flex gap-3 overflow-x-auto snap-x scroll-smooth scrollbar-hide -mx-4 px-4 pb-2">
            {shops.map((shop) => (
              <div key={shop.owner_id} className="snap-start">
                <ShopCard shop={shop} variant="horizontal" onClick={() => onShopClick(shop)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {shops.map((shop) => (
              <ShopCard key={shop.owner_id} shop={shop} onClick={() => onShopClick(shop)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
