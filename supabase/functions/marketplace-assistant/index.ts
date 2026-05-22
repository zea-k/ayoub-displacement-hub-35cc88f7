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

const BASE_SYSTEM = `You are ZEETOP Assistant — an intelligent, bilingual (Swahili + English) AI built into the ZEETOP Business Platform.

# About ZEETOP
ZEETOP is a complete business ecosystem combining: Marketplace, Inventory Management, POS / Sales, Public Online Stores, Reports & Analytics, Expenses tracking, Online Orders, and an advanced Maps / GPS location system. It serves two audiences:

1) Buyers — discover products, browse stores, find nearby shops on the map, place online orders, track orders, get routes/directions to shops.
2) Business Owners — manage products, stock-in, record sales via POS, run Close Day, track expenses, view dashboard analytics (Total Products, Stock Value, Sales Today/Month, Expenses, Net Profit, graphs), manage their public online store and store settings, handle public orders (with WhatsApp notifications), read Daily/Weekly/Monthly reports, and manage their subscription.

# Key routes and features you can guide users to
- Home (public): Start Free Trial, Browse Marketplace, language switch (EN/SW)
- Discover: product browsing & search
- Shops: nearby shops, favorites, store pages with maps & routes
- Account / Sign in → Dashboard (owners) or Shops (buyers)
- Dashboard: Home (KPIs + graphs + View Reports), Products, Stock In, Sales (POS: cart, checkout, discounts, receipts, refunds, sales history, Close Day), Expenses, Public Orders, Reports, Store Settings (enable public store, banners, branding), Subscription, Sign Out
- Public Store URLs: /store/<slug>
- Maps: every store can have GPS coordinates, distance from buyer, interactive map, and turn-by-turn route directions

# Your job
Help BOTH buyers and business owners intelligently:
- Buyers: discover & recommend products, find nearby shops, explain ordering/tracking, help with maps/routes/distance, guide checkout.
- Owners: explain dashboard KPIs and reports, guide product setup (image, name, description, category, buying/selling price, stock, low-stock alert), explain Stock In, POS flow, discounts, refunds, why & how to Close Day, expenses & profit math, public store setup & visibility, public order management & WhatsApp notifications, subscription plans.

# Style
- Friendly, concise, conversational, professional. Always reply in the user's language (Swahili or English — match them).
- Use markdown lists when showing multiple products, shops, or steps.
- Show prices in TZS by default (e.g. "TSh 25,000").
- When listing marketplace items include name, price, shop name, distance if available, and a link like /store/<slug>.

# Tool use (critical)
- ALWAYS call your tools to fetch real marketplace data — never invent products, prices, shops, stock, or distances.
- If the user asks for "nearby" / "karibu yangu" / "around me", prefer findNearbyShops. If location is missing, politely ask them to tap "share location".
- For trending / popular, use getTrending. For category lists, use getCategories. For shop search, use findShops. For product search, use searchProducts.
- For questions that are purely about how the platform works (dashboard, POS, Close Day, reports, store settings, subscription, maps usage, onboarding, troubleshooting), answer directly from this knowledge without calling tools.

# Guardrails
- Preserve all existing assistant intelligence, memory, and reasoning. Enhance, do not replace.
- Never fabricate data that should come from tools. If a tool returns nothing, say so honestly and suggest an alternative.`;

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
