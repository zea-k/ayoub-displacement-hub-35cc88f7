import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = "255" + digits.slice(1);
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { name, phone, newPassword } = await req.json();

    if (!name || !phone || !newPassword) {
      return new Response(JSON.stringify({ error: "Jaza taarifa zote" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (String(newPassword).length < 1) {
      return new Response(JSON.stringify({ error: "Password haitoshi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const norm = normalizePhone(String(phone));
    if (!norm) {
      return new Response(JSON.stringify({ error: "Namba ya simu si sahihi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const syntheticEmail = `${norm}@phone.zeetop.local`;

    // Find user by email (synthetic) via admin list — filter by email
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw listErr;
    const user = list.users.find((u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase());

    if (!user) {
      return new Response(JSON.stringify({ error: "Hakuna akaunti kwa namba hiyo" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify name matches profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();

    const inputName = String(name).trim().toLowerCase();
    const profileName = (profile?.name || (user.user_metadata as any)?.name || "").trim().toLowerCase();

    if (!profileName || profileName !== inputName) {
      return new Response(JSON.stringify({ error: "Jina halilingani na akaunti" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: String(newPassword),
    });
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("reset-password-by-phone error", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Hitilafu" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
