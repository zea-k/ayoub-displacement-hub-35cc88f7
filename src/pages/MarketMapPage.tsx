import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Navigation2, Star, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketShell from "@/components/marketplace/MarketShell";

const NearbyMapInner = lazy(() => import("@/components/map/NearbyMapInner"));

type Shop = {
  business_name: string;
  slug: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  follower_count: number | null;
  engagement_score: number | null;
};

type RankedShop = Shop & { distance_km: number; rankScore: number; tag: "Nearby" | "Trending" | "Popular" | null };

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function MarketMapPage() {
  const { location, status, request } = useUserLocation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(15);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("public_settings")
        .select(
          "business_name, slug, description, category, latitude, longitude, address, follower_count, engagement_score, is_featured",
        )
        .eq("is_public_enabled", true)
        .eq("is_listed", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      setShops((data || []) as Shop[]);
      setLoading(false);
    })();
  }, []);

  const ranked = useMemo<RankedShop[]>(() => {
    if (!shops.length) return [];
    const maxEng = Math.max(1, ...shops.map((s) => s.engagement_score || 0));
    const maxFollow = Math.max(1, ...shops.map((s) => s.follower_count || 0));
    const list = shops.map((s) => {
      const dist = location
        ? haversineKm(location, { lat: s.latitude, lng: s.longitude })
        : 9999;
      // Composite rank: proximity 50% + engagement 30% + followers 20%
      const proxScore = location ? Math.max(0, 1 - dist / radius) : 0;
      const engScore = (s.engagement_score || 0) / maxEng;
      const folScore = (s.follower_count || 0) / maxFollow;
      const rankScore = proxScore * 0.5 + engScore * 0.3 + folScore * 0.2;
      let tag: RankedShop["tag"] = null;
      if (location && dist <= 2) tag = "Nearby";
      else if (engScore > 0.7) tag = "Trending";
      else if (folScore > 0.7) tag = "Popular";
      return { ...s, distance_km: +dist.toFixed(2), rankScore, tag };
    });
    let filtered = location ? list.filter((s) => s.distance_km <= radius) : list;
    filtered.sort((a, b) => b.rankScore - a.rankScore);
    return filtered;
  }, [shops, location, radius]);

  return (
    <MarketShell active="discover">
      <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Nearby Shops
            </h1>
            <p className="text-xs text-muted-foreground">
              Personalized ranking · proximity + trending + popular
            </p>
          </div>
          {!location && (
            <Button size="sm" onClick={request} disabled={status === "requesting"}>
              <Navigation2 className="mr-1.5 h-4 w-4" />
              {status === "requesting" ? "Locating…" : "Share location"}
            </Button>
          )}
        </div>

        {location && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Radius</span>
            {[5, 10, 15, 30, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  radius === r
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        )}

        <Card className="overflow-hidden h-[380px]">
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            }
          >
            <NearbyMapInner
              userLocation={location}
              shops={ranked.map((s) => ({
                slug: s.slug,
                name: s.business_name,
                lat: s.latitude,
                lng: s.longitude,

              }))}
            />
          </Suspense>
        </Card>

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : ranked.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No shops within {radius} km. Try a wider radius.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ranked.map((s, i) => (
              <Link
                key={s.slug}
                to={`/store/${s.slug}`}
                className="block group"
              >
                <Card className="p-4 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-sm font-bold text-primary">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{s.business_name}</h3>
                        {s.tag === "Nearby" && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            <MapPin className="h-3 w-3 mr-0.5" /> Nearby
                          </Badge>
                        )}
                        {s.tag === "Trending" && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            <TrendingUp className="h-3 w-3 mr-0.5" /> Trending
                          </Badge>
                        )}
                        {s.tag === "Popular" && (
                          <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                            <Star className="h-3 w-3 mr-0.5" /> Popular
                          </Badge>
                        )}
                      </div>
                      {s.category && (
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {s.category}
                        </p>
                      )}
                      {s.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        {location && (
                          <span className="flex items-center gap-1">
                            <Navigation2 className="h-3 w-3" />
                            {s.distance_km < 1
                              ? `${Math.round(s.distance_km * 1000)} m`
                              : `${s.distance_km} km`}
                          </span>
                        )}
                        {s.follower_count != null && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" /> {s.follower_count}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-primary">
                          <Sparkles className="h-3 w-3" />
                          {Math.round(s.rankScore * 100)} rank
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MarketShell>
  );
}
