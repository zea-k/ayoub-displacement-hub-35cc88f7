// ZEETOP Marketplace AI assistant — streams via AI SDK + Lovable AI Gateway
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
} from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Loc = { lat: number; lng: number } | null;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const BASE_SYSTEM = `You are ZEETOP's bilingual (Swahili + English) AI shopping assistant for a smart marketplace.

You help shoppers discover products and stores, compare prices, find nearby shops, see what's trending, understand stock, delivery and ordering.

Style:
- Friendly, concise, conversational. Respond in the user's language (Swahili or English).
- Use markdown lists when showing multiple products or shops.
- Always call your tools to fetch real data — never invent products, prices, or shops.
- Show price in TZS by default (e.g. "TSh 25,000").
- When listing items include name, price, shop name, distance if available, and a link like /store/<slug>.
- If user asks for "nearby"/"karibu yangu", prefer findNearbyShops.`;

function buildTools(location: Loc) {
  return {
    searchProducts: tool({
      description:
        "Search public marketplace products by keyword. Returns name, price, stock, shop name, shop slug.",
      inputSchema: z.object({
        query: z.string(),
        maxPrice: z.number().optional(),
        limit: z.number().int().min(1).max(20).default(8),
      }),
      execute: async ({ query, maxPrice, limit }) => {
        let q = supabase
          .from("products")
          .select("name, selling_price, stock, category, owner_id, description, likes_count")
          .eq("public_visible", true)
          .gt("stock", 0)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .order("likes_count", { ascending: false })
          .limit(limit);
        if (maxPrice) q = q.lte("selling_price", maxPrice);
        const { data: products, error } = await q;
        if (error) return { error: error.message };
        const ownerIds = [...new Set((products || []).map((p) => p.owner_id))];
        const { data: shops } = await supabase
          .from("public_settings")
          .select("owner_id, business_name, slug, latitude, longitude")
          .in("owner_id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"])
          .eq("is_public_enabled", true);
        const shopMap = new Map((shops || []).map((s: any) => [s.owner_id, s]));
        return {
          count: products?.length || 0,
          products: (products || [])
            .filter((p) => shopMap.has(p.owner_id))
            .map((p) => {
              const s: any = shopMap.get(p.owner_id);
              const distance_km = location && s.latitude && s.longitude
                ? +haversineKm(location, { lat: s.latitude, lng: s.longitude }).toFixed(2)
                : null;
              return {
                name: p.name,
                price: p.selling_price,
                stock: p.stock,
                category: p.category,
                shop_name: s.business_name,
                distance_km,
                link: `/store/${s.slug}`,
              };
            })
            .sort((a, b) =>
              a.distance_km != null && b.distance_km != null ? a.distance_km - b.distance_km : 0,
            ),
        };
      },
    }),

    findShops: tool({
      description: "Search listed public stores by keyword or list popular shops.",
      inputSchema: z.object({
        query: z.string().optional(),
        limit: z.number().int().min(1).max(20).default(8),
      }),
      execute: async ({ query, limit }) => {
        let q = supabase
          .from("public_settings")
          .select("business_name, slug, description, category, latitude, longitude, address, follower_count, engagement_score")
          .eq("is_public_enabled", true)
          .eq("is_listed", true)
          .order("engagement_score", { ascending: false })
          .limit(limit);
        if (query) {
          q = q.or(
            `business_name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`,
          );
        }
        const { data, error } = await q;
        if (error) return { error: error.message };
        return {
          count: data?.length || 0,
          shops: (data || []).map((s: any) => ({
            ...s,
            distance_km: location && s.latitude && s.longitude
              ? +haversineKm(location, { lat: s.latitude, lng: s.longitude }).toFixed(2)
              : null,
            link: `/store/${s.slug}`,
          })),
        };
      },
    }),

    findNearbyShops: tool({
      description:
        "List shops nearest to the user's current location, sorted by distance. Requires the user to have shared location.",
      inputSchema: z.object({
        radiusKm: z.number().default(15),
        limit: z.number().int().min(1).max(25).default(10),
        category: z.string().optional(),
      }),
      execute: async ({ radiusKm, limit, category }) => {
        if (!location) {
          return { error: "no_location", message: "User has not shared their location yet." };
        }
        let q = supabase
          .from("public_settings")
          .select("business_name, slug, description, category, latitude, longitude, address, engagement_score")
          .eq("is_public_enabled", true)
          .eq("is_listed", true)
          .not("latitude", "is", null)
          .not("longitude", "is", null);
        if (category) q = q.ilike("category", `%${category}%`);
        const { data, error } = await q;
        if (error) return { error: error.message };
        const ranked = (data || [])
          .map((s: any) => ({
            ...s,
            distance_km: +haversineKm(location, { lat: s.latitude, lng: s.longitude }).toFixed(2),
            link: `/store/${s.slug}`,
          }))
          .filter((s: any) => s.distance_km <= radiusKm)
          .sort((a: any, b: any) => a.distance_km - b.distance_km)
          .slice(0, limit);
        return { count: ranked.length, userLocation: location, shops: ranked };
      },
    }),

    getTrending: tool({
      description: "Get currently trending products across the marketplace.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(15).default(6) }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from("products")
          .select("name, selling_price, likes_count, owner_id")
          .eq("public_visible", true)
          .gt("stock", 0)
          .order("likes_count", { ascending: false })
          .limit(limit);
        if (error) return { error: error.message };
        const ownerIds = [...new Set((data || []).map((p) => p.owner_id))];
        const { data: shops } = await supabase
          .from("public_settings")
          .select("owner_id, business_name, slug")
          .in("owner_id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
        const shopMap = new Map((shops || []).map((s: any) => [s.owner_id, s]));
        return {
          products: (data || []).map((p) => {
            const s: any = shopMap.get(p.owner_id);
            return {
              name: p.name,
              price: p.selling_price,
              likes: p.likes_count,
              shop_name: s?.business_name,
              link: s ? `/store/${s.slug}` : null,
            };
          }),
        };
      },
    }),

    getCategories: tool({
      description: "List all marketplace categories.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase.from("categories").select("name, slug").order("sort_order");
        return { categories: data || [] };
      },
    }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const messages = body.messages;
    const location: Loc =
      body.location && typeof body.location.lat === "number" && typeof body.location.lng === "number"
        ? { lat: body.location.lat, lng: body.location.lng }
        : null;
    const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
    const modelMessages = await convertToModelMessages(messages);
    const system = location
      ? `${BASE_SYSTEM}\n\nUser current location: lat=${location.lat}, lng=${location.lng}. Prefer nearby results.`
      : `${BASE_SYSTEM}\n\nUser location: unknown. If the user asks for "nearby" politely note they can tap "share location".`;
    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      messages: modelMessages,
      tools: buildTools(location),
      stopWhen: stepCountIs(50),
      onError: ({ error }) => console.error("[assistant] streamText error:", error),
    });
    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    console.error("assistant error", e, (e as Error)?.stack);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
