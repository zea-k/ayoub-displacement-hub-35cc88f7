// AI-powered Discover feed
// - Reads the user's recent activity, likes and saves
// - Calls Lovable AI Gateway with structured tool calling to rank candidate products
// - Returns ordered product IDs the client uses to render the personalized feed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData } = await userClient.auth.getUser();
    const userId = userData.user?.id ?? null;

    // 1) Build a candidate pool of public products (always returned, ordered by recency + engagement)
    const { data: candidates } = await adminClient
      .from("products")
      .select(
        "id, name, selling_price, image_url, category, description, likes_count, comments_count, saves_count, owner_id, created_at"
      )
      .eq("public_visible", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(80);

    const pool = candidates ?? [];

    // No user → return engagement-ranked list (rule based)
    if (!userId || !LOVABLE_API_KEY || pool.length === 0) {
      const ranked = [...pool]
        .sort(
          (a, b) =>
            (b.likes_count + b.saves_count + b.comments_count) -
            (a.likes_count + a.saves_count + a.comments_count)
        )
        .map((p) => p.id);
      return jsonResponse({ orderedProductIds: ranked, mode: "rule-based" });
    }

    // 2) Fetch user signals
    const [actsRes, likesRes, savesRes] = await Promise.all([
      adminClient
        .from("user_activity")
        .select("activity_type, target_id, target_category, duration_seconds, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(120),
      adminClient.from("product_likes").select("product_id").eq("user_id", userId).limit(60),
      adminClient.from("product_saves").select("product_id").eq("user_id", userId).limit(60),
    ]);

    const activity = actsRes.data ?? [];
    const likedIds = new Set((likesRes.data ?? []).map((r) => r.product_id));
    const savedIds = new Set((savesRes.data ?? []).map((r) => r.product_id));

    if (activity.length === 0 && likedIds.size === 0 && savedIds.size === 0) {
      const ranked = [...pool]
        .sort(
          (a, b) =>
            (b.likes_count + b.saves_count + b.comments_count) -
            (a.likes_count + a.saves_count + a.comments_count)
        )
        .map((p) => p.id);
      return jsonResponse({ orderedProductIds: ranked, mode: "cold-start" });
    }

    // 3) Build a compact prompt
    const categoryCount: Record<string, number> = {};
    activity.forEach((a) => {
      if (a.target_category) {
        categoryCount[a.target_category] = (categoryCount[a.target_category] || 0) + 1;
      }
    });
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([c]) => c);

    const compact = pool.slice(0, 50).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      price: Number(p.selling_price),
      likes: p.likes_count,
    }));

    // 4) Ask AI to rank
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a marketplace recommendation engine. Rank candidate products for a shopper based on their interests. Return only the most relevant ~30 product ids in order.",
          },
          {
            role: "user",
            content: JSON.stringify({
              userTopCategories: topCategories,
              likedProductIds: Array.from(likedIds).slice(0, 30),
              savedProductIds: Array.from(savedIds).slice(0, 30),
              candidates: compact,
            }),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_products",
              description: "Return the personalized ordering of product ids",
              parameters: {
                type: "object",
                properties: {
                  ordered_product_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Product ids ordered from most to least relevant",
                  },
                },
                required: ["ordered_product_ids"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_products" } },
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402) {
      // Fallback to rule-based on rate-limit / payment issues
      const ranked = [...pool]
        .sort(
          (a, b) =>
            (b.likes_count + b.saves_count + b.comments_count) -
            (a.likes_count + a.saves_count + a.comments_count)
        )
        .map((p) => p.id);
      return jsonResponse({ orderedProductIds: ranked, mode: "fallback" });
    }

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, text);
      const ranked = pool.map((p) => p.id);
      return jsonResponse({ orderedProductIds: ranked, mode: "ai-error" });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let aiOrdered: string[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        aiOrdered = Array.isArray(parsed?.ordered_product_ids)
          ? parsed.ordered_product_ids
          : [];
      } catch (e) {
        console.error("Failed to parse tool args", e);
      }
    }

    // Append any pool items the AI didn't include (so the feed never shrinks)
    const seen = new Set(aiOrdered);
    const tail = pool.map((p) => p.id).filter((id) => !seen.has(id));
    const final = [...aiOrdered, ...tail];

    return jsonResponse({ orderedProductIds: final, mode: "ai" });
  } catch (e) {
    console.error("personalized-discover error", e);
    return jsonResponse({ orderedProductIds: [], mode: "error" }, 200);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
