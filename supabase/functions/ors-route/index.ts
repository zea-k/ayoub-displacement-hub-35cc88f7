// Proxy edge function for OpenRouteService directions API.
// Keeps ORS_API_KEY secret on the server.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { start, end, profile = "driving-car" } = await req.json();

    // Validate coordinates: [lng, lat]
    if (
      !Array.isArray(start) || start.length !== 2 ||
      !Array.isArray(end) || end.length !== 2 ||
      start.some((n) => typeof n !== "number" || !isFinite(n)) ||
      end.some((n) => typeof n !== "number" || !isFinite(n))
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates. Expected start/end as [lng, lat] number arrays." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const allowedProfiles = ["driving-car", "foot-walking", "cycling-regular"];
    const useProfile = allowedProfiles.includes(profile) ? profile : "driving-car";

    const apiKey = Deno.env.get("ORS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ORS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const orsRes = await fetch(
      `https://api.openrouteservice.org/v2/directions/${useProfile}/geojson`,
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json, application/geo+json",
        },
        body: JSON.stringify({ coordinates: [start, end] }),
      },
    );

    const data = await orsRes.json();
    if (!orsRes.ok) {
      return new Response(
        JSON.stringify({ error: data?.error?.message || "Routing failed", details: data }),
        { status: orsRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const feature = data?.features?.[0];
    const coords: [number, number][] = (feature?.geometry?.coordinates || []).map(
      (c: number[]) => [c[1], c[0]] as [number, number], // -> [lat, lng] for Leaflet
    );
    const summary = feature?.properties?.summary || {};

    return new Response(
      JSON.stringify({
        coords,
        distance_m: summary.distance ?? 0,
        duration_s: summary.duration ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
