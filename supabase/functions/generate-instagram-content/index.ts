import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product, style } = await req.json();

    if (!product || !style) {
      return new Response(JSON.stringify({ error: "Missing product or style" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stockStatus = product.stock <= 5 ? "Very limited stock" : product.stock <= 20 ? "Limited stock" : "In stock";

    const prompt = `You are an expert Instagram marketing copywriter for a business in Dar es Salaam, Tanzania.

Generate an Instagram post for this product:
- Name: ${product.name}
- Price: TZS ${product.selling_price?.toLocaleString() || product.selling_price}
- Category: ${product.category || "General"}
- Description: ${product.description || "No description"}
- Stock: ${stockStatus}

Style: ${style}

Rules:
- Caption must have: Hook sentence, Product highlight, Price mention, Call To Action
- Use natural emojis (not excessive, max 5-7)
- Write in English with optional Swahili phrases for local appeal
- Keep caption under 300 words
- Make it engaging and professional

For hashtags, generate exactly 13 hashtags:
- 5 local hashtags (Tanzania, Dar es Salaam, local market)
- 5 niche hashtags (product category specific)
- 3 general ecommerce hashtags

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"caption": "your caption here", "hashtags": "#tag1 #tag2 #tag3..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI Gateway error:", err);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    let parsed;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = { caption: raw, hashtags: "" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
