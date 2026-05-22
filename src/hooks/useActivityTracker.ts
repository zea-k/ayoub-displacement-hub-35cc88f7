import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type ActivityType = "view_shop" | "view_product" | "click_shop" | "click_product";

export function useActivityTracker() {
  const startTimeRef = useRef<Record<string, number>>({});

  const track = useCallback(async (
    activityType: ActivityType,
    targetId: string,
    targetCategory?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: activityType,
        target_id: targetId,
        target_category: targetCategory || "",
      });
    } catch {
      // tracking must never block UX
    }
  }, []);

  const startTimer = useCallback((key: string) => {
    startTimeRef.current[key] = Date.now();
  }, []);

  const stopTimer = useCallback(async (
    key: string,
    activityType: ActivityType,
    targetId: string,
    targetCategory?: string
  ) => {
    const start = startTimeRef.current[key];
    if (!start) return;
    const seconds = Math.round((Date.now() - start) / 1000);
    delete startTimeRef.current[key];
    if (seconds < 2) return; // ignore very short views
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: activityType,
        target_id: targetId,
        target_category: targetCategory || "",
        duration_seconds: seconds,
      });
    } catch {
      // silent
    }
  }, []);

  return { track, startTimer, stopTimer };
}

/** Hook to auto-track page view duration */
export function usePageViewTracker(
  activityType: ActivityType,
  targetId: string | undefined,
  targetCategory?: string
) {
  const tracker = useActivityTracker();

  useEffect(() => {
    if (!targetId) return;
    const key = `${activityType}-${targetId}`;
    tracker.startTimer(key);
    tracker.track(activityType, targetId, targetCategory);

    return () => {
      tracker.stopTimer(key, activityType, targetId, targetCategory);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  return tracker;
}
