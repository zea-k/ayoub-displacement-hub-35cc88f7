import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface RouteResult {
  coords: [number, number][];
  distance_m: number;
  duration_s: number;
}

export function useShopRoute(
  start: [number, number] | null,
  end: [number, number] | null,
  enabled = true,
) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !start || !end) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: invokeErr } = await supabase.functions.invoke("ors-route", {
          body: {
            start: [start[1], start[0]], // ORS wants [lng, lat]
            end: [end[1], end[0]],
          },
        });
        if (cancelled) return;
        if (invokeErr) throw new Error(invokeErr.message);
        if ((data as any)?.error) throw new Error((data as any).error);
        setRoute(data as RouteResult);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [start?.[0], start?.[1], end?.[0], end?.[1], enabled]);

  return { route, loading, error };
}

export function useUserLocation() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(false);

  const request = () => {
    if (!("geolocation" in navigator)) {
      setDenied(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        setDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return { position, denied, loading, request };
}
