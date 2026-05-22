import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ShopScore {
  slug: string;
  score: number;
  reason: "engagement" | "category" | "recent";
}

interface PersonalizationResult {
  recommendedSlugs: string[];
  preferredCategories: string[];
  loading: boolean;
}

export function usePersonalizedShops(): PersonalizationResult {
  const [recommendedSlugs, setRecommendedSlugs] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const build = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Fetch last 200 activities (recent bias)
        const { data: activities } = await supabase
          .from("user_activity")
          .select("activity_type, target_id, target_category, duration_seconds, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200);

        if (!activities || activities.length === 0) { setLoading(false); return; }

        // Score shops by engagement
        const shopScores: Record<string, number> = {};
        const categoryCount: Record<string, number> = {};
        const now = Date.now();

        for (const a of activities) {
          const isShop = a.activity_type.includes("shop");
          if (!isShop) continue;

          const slug = a.target_id;
          // Recency weight: activities in last 24h = 3x, last week = 2x, older = 1x
          const age = (now - new Date(a.created_at).getTime()) / 3600000;
          const recencyWeight = age < 24 ? 3 : age < 168 ? 2 : 1;

          // Type weight: clicks > views
          const typeWeight = a.activity_type === "click_shop" ? 2 : 1;

          // Duration bonus
          const durationBonus = Math.min((a.duration_seconds || 0) / 30, 3);

          const score = (typeWeight + durationBonus) * recencyWeight;
          shopScores[slug] = (shopScores[slug] || 0) + score;

          if (a.target_category) {
            categoryCount[a.target_category] = (categoryCount[a.target_category] || 0) + 1;
          }
        }

        // Also score from product views → map to category preferences
        for (const a of activities) {
          if (a.activity_type.includes("product") && a.target_category) {
            categoryCount[a.target_category] = (categoryCount[a.target_category] || 0) + 1;
          }
        }

        // Top shops by score
        const sorted = Object.entries(shopScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([slug]) => slug);

        // Top categories
        const topCats = Object.entries(categoryCount)
          .filter(([cat]) => cat && cat.length > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat]) => cat);

        setRecommendedSlugs(sorted);
        setPreferredCategories(topCats);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    build();
  }, []);

  return { recommendedSlugs, preferredCategories, loading };
}
