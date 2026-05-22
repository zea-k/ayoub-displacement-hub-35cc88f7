import { supabase } from "@/lib/supabase";

export async function logActivity(
  actionType: string,
  description: string,
  relatedId?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("activity_logs").insert({
      action_type: actionType,
      description,
      related_id: relatedId || null,
      owner_id: user.id,
      user_id: user.id,
    });
  } catch {
    // Logging must never block the main flow
  }
}
